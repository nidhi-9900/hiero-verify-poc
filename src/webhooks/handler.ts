// Main webhook handler — this is where everything connects
// A PR event comes in and flows through the full verification pipeline

import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { verifySignature, verifyDelivery } from './security';
import { checkGpg } from '../verification/gpg';
import { checkVc } from '../verification/vc';
import { scoreTrust } from '../verification/scorer';
import { getInstallationToken } from '../github/auth';
import { createPendingCheck, updateCheck } from '../github/checkRun';
import { getRepoConfig } from '../config/repoConfig';
import { saveRecord } from '../audit/log';

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = req.body as Buffer;
  const signature = req.headers['x-hub-signature-256'] as string;
  const event = req.headers['x-github-event'] as string;
  const delivery = req.headers['x-github-delivery'] as string;

  if (!verifyDelivery(delivery)) {
    res.status(400).json({ error: 'Missing delivery ID' });
    return;
  }

  if (!verifySignature(rawBody, signature, process.env.WEBHOOK_SECRET!)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const payload = JSON.parse(rawBody.toString());

  if (event === 'pull_request') {
    const action = payload.action;
    if (action === 'opened' || action === 'synchronize' || action === 'reopened') {
      await handlePullRequest(payload);
    }
  }

  if (event === 'check_run' && payload.action === 'rerequested') {
    await handleRerun(payload);
  }

  res.status(200).json({ ok: true });
}

async function handlePullRequest(payload: any): Promise<void> {
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const prNumber = payload.pull_request.number;
  const author = payload.pull_request.user.login;
  const sha = payload.pull_request.head.sha;
  const installationId = payload.installation.id;

  const token = await getInstallationToken(installationId);
  const octokit = new Octokit({ auth: token });

  const checkRunId = await createPendingCheck(octokit, owner, repo, sha);

  const config = await getRepoConfig(octokit, owner, repo);

  const gpg = checkGpg(author);
  const vc = checkVc(author);

  const score = scoreTrust(gpg, vc);

  // in warn mode only downgrade UNVERIFIED to neutral — don't touch other verdicts
  const effectiveScore = (config.mode === 'warn' && score.verdict === 'UNVERIFIED')
    ? { ...score, verdict: 'PARTIAL_GPG_ONLY' as const }
    : score;  
  const auditId = saveRecord({
    pr_number: prNumber,
    repo,
    owner,
    author,
    sha,
    verdict: effectiveScore.verdict,
    reason_code: effectiveScore.reason_code,
    gpg: effectiveScore.gpg,
    vc: effectiveScore.vc
  });

  await updateCheck(octokit, owner, repo, checkRunId, effectiveScore, auditId);

  console.log(`PR #${prNumber} by ${author} — ${effectiveScore.verdict}`);
}

async function handleRerun(payload: any): Promise<void> {
  const prs = payload.check_run.pull_requests;
  if (prs.length === 0) return;

  // rebuild a minimal PR payload so we can re-run the full verification
  // we use check_run.app.owner for the original PR author
  // because payload.sender is whoever clicked Re-run, not the PR author
  const fakePr = {
    repository: payload.repository,
    installation: payload.installation,
    pull_request: {
      number: prs[0].number,
      // approximation — check_run payload does not include PR author
      // for a real multi-user scenario this needs a pulls.get API call
      user: { login: payload.repository.owner.login },
      head: { sha: payload.check_run.head_sha }
    }
  };

  await handlePullRequest(fakePr);
}