# One Click Transcript — Product Requirements

**A Division of Brick Outdoor Living, Inc.**

## Vision
Tactical, high-security mobile vault that retrieves, verifies, and shares academic
credentials with military-grade rigor. Visual language: Command Center Navy/Gold
(Military-HBCU). Multilingual EN/ES from launch.

## Personas
- Undergraduate from UAPB, CSUN (initial portals).
- Recruiter receiving a self-destructing transcript link.

## Core Flows
1. **Onboarding → ID.me Bridge** — mocked OIDC bridge that marks the user
   `Verified Student`. The bridge collects legal name + student email and
   stamps verification timestamp.
2. **AI Browser Liaison** — 4-step flow: portal pick → credential entry →
   MFA gate (Duo push for UAPB, SMS code for CSUN) → live progress with a
   7-step tactical step list → encrypted vault deposit.
3. **Academic Vault** — AES-256 (logical) document list. Each card shows the
   institution, GPA, credits, retrieval timestamp, and a VERIFIED chip when
   ID.me has been completed.
4. **Document Viewer** — Watermarked transcript ("VERIFIED STUDENT • ID.ME •
   TIER-1") rendered over a paper texture. 1-Tap Share entry.
5. **1-Tap Share** — Generate self-destructing secure links with selectable
   expiration (1h/24h/72h/7d) and max view count (1/3/5). History view with
   manual revoke button.
6. **Trust Dashboard** — AES-256-GCM badge, Secure Enclave key storage,
   biometric lock state, compliance pills (FERPA / SOC 2), full activity log.
7. **Settings** — EN/ES toggle, identity status, biometric lock switch,
   legal ownership.

## Non-Functional
- All legal footers carry `A DIVISION OF BRICK OUTDOOR LIVING, INC.`
- Every interactive element exposes a `testID`.
- Self-destruct enforcement happens server-side; first GET past max_views
  returns HTTP 410.

## Mocked / Stubbed Surface
- **ID.me OIDC** is mocked end-to-end. Swap in a real Client ID + JWKS endpoint
  to ship to production.
- **AI Browser Liaison** is simulated. The portal navigation, credential POST,
  and MFA handshake all execute against fixtures in `PORTAL_CATALOG`. The 4-step
  UX, terminal, and DUO/SMS gates are real and ready to be wired to a Playwright
  worker.
- **Encrypted vault** stores transcript content as text fixtures with an
  `encrypted: true` flag. Production should layer AES-256-GCM with keys held in
  the device's Secure Enclave / EncryptedSharedPreferences.

## Stack
- **Frontend:** Expo SDK 54, expo-router, React Native 0.81, Reanimated,
  Ionicons, expo-clipboard.
- **Backend:** FastAPI, Motor (MongoDB), Pydantic v2.
- **Storage:** `@/src/utils/storage` (AsyncStorage + SecureStore).
- **i18n:** in-house EN/ES dictionary, no third-party runtime.
