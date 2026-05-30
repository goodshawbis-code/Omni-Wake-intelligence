# One Click Transcript — Product Requirements

**A Division of Brick Outdoor Living, Inc.**

## Vision
Tactical, high-security mobile vault that retrieves, verifies, and shares academic
credentials with military-grade rigor. Visual language: Command Center Navy/Gold
(Military-HBCU). Multilingual EN/ES from launch.

## Coverage
- **Catalog**: 104 hand-curated seed schools across 9 categories — Ivy League (8),
  HBCUs (13), Big Ten + public flagships (~25), UC system (9), CSU system (7),
  liberal arts (8), top private research (15), study-abroad/international (16+).
- **Schema is IPEDS-aligned** (NCES UnitID stored per row where available) so a
  one-time loader can expand to the full ~6,500 accredited US institutions
  without touching the API contract.
- **International**: Oxford, Cambridge, Imperial, UCL, LSE, Edinburgh, Toronto,
  McGill, UBC, Waterloo, ETH/EPFL, Sciences Po, Sorbonne, TUM, Heidelberg, NUS,
  NTU, U-Tokyo, Kyoto, HKU, ANU, Melbourne, Sydney, Trinity Dublin.

## Personas
- Undergraduate at any mapped institution.
- Recruiter receiving a self-destructing transcript link.
- Student at an unmapped institution who needs the AI Discovery Mode path.

## Core Flows
1. **Onboarding → ID.me Bridge** — mocked OIDC bridge that marks the user
   `Verified Student`. The bridge collects legal name + student email and
   stamps a verification timestamp used in every watermark.
2. **AI Browser Liaison (mapped)** — Universal Search picks a portal →
   credential entry → MFA gate (Duo push / SMS code / TOTP per portal) →
   7-step retrieval → encrypted vault deposit.
3. **AI Discovery Mode (unmapped)** — `Can't find your school?` → enter
   school name + optional portal URL + creds → agent runs a 9-step crawl
   (`enumerate portal link graph`, `score 'transcript' candidates`,
   `navigate to AI-selected transcript page`) → the synthetic portal is
   persisted on the agent session so multi-worker deployments resolve the
   `agent_complete` step reliably.
4. **Academic Vault** — AES-256 (logical) document list. Each doc carries
   `verified_watermark` when ID.me is complete, `discovery_mode` when the
   AI located the page autonomously, `encrypted=true` always.
5. **Document Viewer** — Watermarked transcript ("VERIFIED STUDENT • ID.ME
   • TIER-1") rendered over a paper texture. 1-Tap Share entry.
6. **1-Tap Share** — Self-destructing public links with expiration chips
   (1h / 24h / 72h / 7d) and view limits (1 / 3 / 5). Backend enforces HTTP
   410 past max views; in-app history with manual revoke.
7. **Trust Dashboard** — AES-256-GCM, Secure Enclave, identity row,
   biometric switch, FERPA/SOC 2 tags, full activity log (ACCOUNT_CREATED,
   ID_ME_VERIFIED, AGENT_STARTED, DISCOVERY_STARTED, MFA_APPROVED,
   DOCUMENT_RETRIEVED, SHARE_CREATED, SHARE_VIEWED, SHARE_REVOKED, …).
8. **Settings** — EN/ES toggle, identity status, biometric lock switch,
   legal ownership, sign-out (wipes local data).

## Non-Functional
- All legal footers carry `A DIVISION OF BRICK OUTDOOR LIVING, INC.`
- Every interactive element exposes a `testID`.
- Self-destruct enforcement happens server-side; first GET past `max_views`
  returns HTTP 410.
- Synthetic Discovery portals persist on the session document so the
  `/agent/complete` step succeeds across worker restarts.

## MOCKED / STUBBED SURFACE — STORE READINESS NOTES
> These are functionally complete inside the app but require live
> integrations before App Store / Play Store submission:

- **ID.me OIDC** — entire handshake is mocked. Swap in real ID.me Client ID,
  redirect URI, and JWKS validation before submission.
- **AI Browser Liaison** — portal navigation is fixture-driven against
  `PORTAL_CATALOG`. The 4-step UX (creds → MFA → 7-step retrieval) is real
  and ready to wrap a Playwright worker per portal.
- **AI Discovery Mode** — synthetic; the 9-step crawl is canned. Production
  needs a real headless crawler + LLM scorer for transcript candidate URLs.
- **Vault AES-256 encryption** — flagged via `encrypted=true` but payloads
  are not actually AES-encrypted at rest. Add libsodium / device Secure
  Enclave key wrap before submission.
- **Biometric lock** — UI switch is wired through `/api/users/settings` but
  no native `expo-local-authentication` gate is enforced yet.

## Stack
- **Frontend:** Expo SDK 54, expo-router, React Native 0.81, Reanimated,
  Ionicons, expo-clipboard.
- **Backend:** FastAPI, Motor (MongoDB), Pydantic v2.
- **Storage:** `@/src/utils/storage` (AsyncStorage + SecureStore).
- **i18n:** in-house EN/ES dictionary, no third-party runtime.
