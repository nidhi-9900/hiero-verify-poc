// Types used across the whole project

export type TrustVerdict = 'VERIFIED' | 'PARTIAL_GPG_ONLY' | 'PARTIAL_VC_ONLY' | 'UNVERIFIED';

export interface GpgResult {
  verified: boolean;
  fingerprint: string | null;
  reason: string;
}

export interface VcResult {
  found: boolean;
  did: string | null;
  reason: string;
}

export interface TrustScore {
  verdict: TrustVerdict;
  reason_code: string;
  gpg: GpgResult;
  vc: VcResult;
}

export interface AuditRecord {
  id: string;
  pr_number: number;
  repo: string;
  owner: string;
  author: string;
  sha: string;
  verdict: TrustVerdict;
  reason_code: string;
  gpg: GpgResult;
  vc: VcResult;
  checked_at: string;
}

export interface RepoConfig {
  required_trust_level: string;
  allow_gpg_only: boolean;
  mode: 'block' | 'warn';
}

export interface Contributor {
  github_login: string;
  gpg_verified: boolean;
  gpg_fingerprint: string | null;
  vc_issued: boolean;
  did: string | null;
}