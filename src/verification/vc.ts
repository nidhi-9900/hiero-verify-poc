// Checks if a contributor has a Verifiable Credential issued by Heka
// Reads from our local registry.json (mock for POC)
// In production this would call the Heka OID4VP endpoint

import fs from 'fs';
import path from 'path';
import { VcResult, Contributor } from '../types';

function getRegistry(): Contributor[] {
  const file = path.join(__dirname, '../../data/registry.json');
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw).contributors;
}

export function checkVc(login: string): VcResult {
  const list = getRegistry();
  const user = list.find(c => c.github_login === login);

  if (!user) {
    return { found: false, did: null, reason: 'Contributor not in registry' };
  }

  if (!user.vc_issued) {
    return { found: false, did: null, reason: 'No credential issued — needs Heka onboarding' };
  }

  return { found: true, did: user.did, reason: 'Valid credential found' };
}