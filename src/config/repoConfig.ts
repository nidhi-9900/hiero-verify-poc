// Reads the per-repo config from .github/hiero-identity.yml
// If the file is missing we just use safe defaults

import { Octokit } from '@octokit/rest';
import yaml from 'js-yaml';
import { RepoConfig } from '../types';

const defaults: RepoConfig = {
  required_trust_level: 'VERIFIED',
  allow_gpg_only: false,
  mode: 'block'
};

export async function getRepoConfig(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<RepoConfig> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: '.github/hiero-identity.yml'
    });

    if ('content' in data) {
      const raw = Buffer.from(data.content, 'base64').toString('utf-8');
      const parsed = yaml.load(raw) as { 'hiero-identity': RepoConfig };
      return { ...defaults, ...parsed['hiero-identity'] };
    }
  } catch {
    // file not found — use defaults
  }

  return defaults;
}