// Creates and updates GitHub Check Runs on pull requests
// First we post "in progress" then update with the final result

import { Octokit } from '@octokit/rest';
import { TrustScore } from '../types';

export async function createPendingCheck(
  octokit: Octokit,
  owner: string,
  repo: string,
  sha: string
): Promise<number> {
  const { data } = await octokit.checks.create({
    owner,
    repo,
    name: 'Hiero Identity Verification',
    head_sha: sha,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    output: {
      title: 'Verifying contributor identity...',
      summary: 'Checking GPG signature and Verifiable Credential.'
    }
  });

  return data.id;
}

export async function updateCheck(
  octokit: Octokit,
  owner: string,
  repo: string,
  checkRunId: number,
  score: TrustScore,
  auditId: string
): Promise<void> {
  const conclusionMap = {
    VERIFIED: 'success',
    PARTIAL_GPG_ONLY: 'neutral',
    PARTIAL_VC_ONLY: 'neutral',
    UNVERIFIED: 'failure'
  } as const;

  const titleMap = {
    VERIFIED: 'Identity Verified',
    PARTIAL_GPG_ONLY: 'Partially Verified - GPG only',
    PARTIAL_VC_ONLY: 'Partially Verified - Credential only',
    UNVERIFIED: 'Identity Not Verified'
  };

  const gpgLine = score.gpg.verified
    ? `GPG Key: Verified (fingerprint: ${score.gpg.fingerprint})`
    : `GPG Key: ${score.gpg.reason}`;

  const vcLine = score.vc.found
    ? `Verifiable Credential: Found (DID: ${score.vc.did})`
    : `Verifiable Credential: ${score.vc.reason}`;

  const summary = [
    `Verdict: ${score.verdict}`,
    `Reason: ${score.reason_code}`,
    '',
    'Identity Signals:',
    gpgLine,
    vcLine,
    '',
    `Audit ID: ${auditId}`
  ].join('\n');

  await octokit.checks.update({
    owner,
    repo,
    check_run_id: checkRunId,
    status: 'completed',
    conclusion: conclusionMap[score.verdict],
    completed_at: new Date().toISOString(),
    output: {
      title: titleMap[score.verdict],
      summary
    }
  });
}