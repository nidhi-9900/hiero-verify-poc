# What This POC Proves

This maps each thing I built to the specific requirement it
addresses in the mentorship spec (Issue #87).

## Spec Requirements vs What I Built

**"Cryptographically linked developer keys (GPG)"**
The GPG verifier in src/verification/gpg.ts checks whether a
contributor has a verified GPG key linked in the registry. The
POC uses a mock registry — the real version will use openpgp.js
to do actual signature verification against keys from GitHub.

**"GitHub App capable of verifying contributor identity"**
The full webhook → verification → check run pipeline runs on
real GitHub PRs. All three verdict states are demonstrated.

**"GitHub App reports verification result as GitHub status check"**
Check runs appear on every PR with the correct conclusion —
success for VERIFIED, neutral for PARTIAL, failure for UNVERIFIED.

**"Transparency of verification decisions"**
Every verification is saved to audit.json with the full signal
breakdown. GET /audit/:repo/:pr_number returns the complete
record so any decision can be inspected after the fact.

**"Repository-specific configurability"**
The app reads .github/hiero-identity.yml from each repo and
respects its settings for required trust level and enforcement
mode. If the file is missing it uses safe defaults.

**"Safety and permissions of automated actions"**
Webhook signature is verified using crypto.timingSafeEqual which
prevents timing attacks. Timestamp freshness check prevents
replayed webhooks. Installation tokens are scoped to specific
repos and cached safely.

**"Research and Design: define credential schema"**
CREDENTIAL_SCHEMA.md defines the SD-JWT VC schema before any
code was written. This is the first deliverable of the R&D phase.

**"Documentation for future development"**
This document and the gap table below are that documentation.

## What This POC Does Not Build

Being honest about this matters more than pretending it is complete.

| Not built              | Current state            | Plan for mentorship     |
|------------------------|--------------------------|-------------------------|
| Real GPG verification  | Registry mock            | openpgp.js in phase 2   |
| Real VC verification   | Registry mock            | Heka OID4VP in phase 3  |
| did:hedera anchoring   | did:key in registry      | Hashgraph SDK phase 2   |
| Contributor onboarding | No UI                    | React + Heka phase 3    |
| VC revocation          | Not built                | Hedera registry phase 4 |
| Database               | JSON file                | SQLite or Heka phase 2  |

## Why the Mocks Are Acceptable

The mock functions return the same typed interfaces that the real
implementations will return. GpgResult and VcResult in types.ts
do not change when the real code goes in. The scorer, the check
run reporter, and the audit log all stay the same. The pipeline
is proven. The verification details are mentorship work.