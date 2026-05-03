// Handles GitHub App authentication
// We need two tokens — a JWT to prove we are the app,
// then an installation token to act on a specific repo

import jwt from 'jsonwebtoken';
import fs from 'fs';
import { Octokit } from '@octokit/rest';

// Cache tokens so we don't request a new one every webhook
const cache = new Map<number, { token: string; expiresAt: Date }>();

function makeJwt(): string {
  const appId = process.env.APP_ID!;
  const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH!, 'utf-8');

  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: appId,
      iat: now - 60,        // 60 seconds in the past to handle clock skew
      exp: now + (9 * 60)   // 9 minutes from now — safely under GitHub's 10 min limit
    },
    privateKey,
    { algorithm: 'RS256' }
  );
}

export async function getInstallationToken(installationId: number): Promise<string> {
  const cached = cache.get(installationId);

  // reuse token if it has more than 60 seconds left
  if (cached && cached.expiresAt > new Date(Date.now() + 60_000)) {
    return cached.token;
  }

  const octokit = new Octokit({ auth: makeJwt() });

  const { data } = await octokit.apps.createInstallationAccessToken({
    installation_id: installationId
  });

  cache.set(installationId, {
    token: data.token,
    expiresAt: new Date(data.expires_at)
  });

  return data.token;
}