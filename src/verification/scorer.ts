// Combines GPG and VC results into one final trust verdict
// This is the core logic — pure function, no external dependencies

import { GpgResult, VcResult, TrustScore, TrustVerdict } from '../types';

export function scoreTrust(gpg: GpgResult, vc: VcResult): TrustScore {
  let verdict: TrustVerdict;
  let reason_code: string;

  if (gpg.verified && vc.found) {
    verdict = 'VERIFIED';
    reason_code = 'BOTH_GPG_AND_VC_PRESENT';
  } else if (gpg.verified && !vc.found) {
    verdict = 'PARTIAL_GPG_ONLY';
    reason_code = 'GPG_VERIFIED_NO_VC';
  } else if (!gpg.verified && vc.found) {
    verdict = 'PARTIAL_VC_ONLY';
    reason_code = 'VC_FOUND_NO_GPG';
  } else {
    verdict = 'UNVERIFIED';
    reason_code = 'NO_IDENTITY_SIGNALS';
  }

  return { verdict, reason_code, gpg, vc };
}