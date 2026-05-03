# ContributorIdentityCredential — Schema Design

I wrote this before touching any application code because the
credential schema is the design foundation. If you get the schema
wrong, the whole verification system ends up solving the wrong
problem.

## The Core Question

When a contributor opens a PR, what exactly does the GitHub App
need to know to trust them? Just their GitHub username? Their
email? Their GPG key fingerprint?

The answer is: as little as possible. The verifier should get
exactly what it needs and nothing else. That is why this uses
SD-JWT format instead of a plain JWT.

## What SD-JWT Gives Us

A plain JWT credential puts everything in the token and every
verifier sees everything. SD-JWT lets the contributor choose
what to reveal per situation.

In practice that means: when proving identity to a GitHub App
during a PR check, the contributor reveals their GitHub username
and nothing else. Their email stays private. Their GPG fingerprint
only comes out in an audit context.

This is not over-engineering. It is the minimum reasonable privacy
design for an identity system used across many open source repos.

## Claims That Are Always Visible

These identify the credential itself. You cannot hide them.

| Claim | What It Contains                        |
|-------|-----------------------------------------|
| iss   | DID of the Heka issuer service          |
| sub   | DID of this specific contributor        |
| iat   | Timestamp when credential was issued    |
| exp   | Timestamp when it expires               |
| vct   | ContributorIdentityCredential           |

## Claims the Contributor Controls

| Claim               | Shown to GitHub App | Why                               |
|---------------------|---------------------|-----------------------------------|
| github_username     | Yes                 | Needed to match PR author         |
| verification_date   | Yes                 | So verifier knows it is recent    |
| gpg_key_fingerprint | Only for audits     | Not needed for a basic PR check   |
| verified_email      | No                  | Not needed, keep it private       |

## Where This POC Is Honest

Right now the POC does not issue or verify real SD-JWT credentials.
It checks a local registry.json file instead.

The schema above defines what a real credential would look like
when the system integrates with the Heka Identity Platform in the
mentorship period. The interfaces in types.ts (VcResult) are
already shaped around this schema so the real implementation
drops in without changing the rest of the system.

## DID Method

For the POC the issuer and contributor DIDs in registry.json use
did:key format which is self-contained and needs no external
infrastructure.

In production these would be did:hedera DIDs anchored on the
Hedera network using the Hashgraph DID SDK, giving each credential
a public, immutable, auditable record.

## What Gets Built in the Mentorship

Phase 2 — real GPG verification, replace registry mock for GPG
Phase 3 — Heka OID4VP integration, real SD-JWT credential check
Phase 3 — contributor onboarding flow with Heka cloud wallet
Phase 4 — VC revocation on Hedera so compromised credentials
          can be invalidated