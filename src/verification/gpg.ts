// Checks if a contributor has a verified GPG key
// Reads from our local registry.json (mock for POC)
// In production this would do a real GPG challenge-response

import fs from 'fs';
import path from 'path';
import { GpgResult, Contributor } from '../types';

function getRegistry(): Contributor[] {
  const file = path.join(__dirname, '../../data/registry.json');
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw).contributors;
}

export function checkGpg(login: string): GpgResult {
  const list = getRegistry();
  const user = list.find(c => c.github_login === login);

  if (!user) {
    return { verified: false, fingerprint: null, reason: 'Contributor not in registry' };
  }

  if (!user.gpg_verified) {
    return { verified: false, fingerprint: null, reason: 'No GPG key linked' };
  }

  return { verified: true, fingerprint: user.gpg_fingerprint, reason: 'GPG key found' };
}