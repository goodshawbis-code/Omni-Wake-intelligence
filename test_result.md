#====================================================================================================
# OMNI WAKE INTELLIGENCE — Test Result Spec (post full in-place transformation)
#====================================================================================================

user_problem_statement: |
  Full in-place transformation from "One Click Transcript" (Verified-Student
  academic transcript vault) into "Omni Wake intelligence" — Secure AI
  Ingestion & Strategic Thought Blueprints Platform.

  Preserved on purpose (to keep TestFlight readiness):
    • Expo slug:           one-click-transcript
    • iOS bundleIdentifier: com.brickoutdoorliving.oneclicktranscript
    • ASC App ID:          6778347603
    • Apple Team ID:       J63873JACF
    • ASC API key:         33J9GYBSPZ (.p8 in Expo Cloud from Cycling Coach)

  Owner footer: "A Division of Brick Outdoor Living, Inc."

  Palette:  Gold #C5A559 / #FFD700  •  Navy #0A1628 / #1B2838 / #1E3A5F

backend:
  - task: "Backend rewrite — Oracle AI Ingestion API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Brand-new FastAPI surface:
            POST   /api/ingress/bootstrap         — idempotent operator provision
            POST   /api/ingress/verify            — Tier-2 secure ingress
            POST   /api/ingress/settings          — language + biometric lock
            POST   /api/thoughts                  — create text/audio/hybrid thought
            GET    /api/thoughts/{operator_id}    — list thoughts
            GET    /api/thoughts/item/{id}        — fetch thought
            DELETE /api/thoughts/item/{id}        — purge thought
            POST   /api/blueprints/synthesise     — Oracle AI synthesis (Sonnet 4.5)
            GET    /api/blueprints/{operator_id}  — list blueprints
            GET    /api/blueprints/item/{id}      — fetch blueprint
            POST   /api/blueprints/item/{id}/pin  — toggle pin
            DELETE /api/blueprints/item/{id}      — purge blueprint
            GET    /api/custody/dashboard/{operator_id} — full operator dashboard
            (+ existing /api/kernel/* Evolutionary Kernel routes, preserved)
          End-to-end verified via curl: bootstrap → create thought → synthesise →
          Oracle returned title "Q3 Latin America Expansion Strategy",
          classification CONFIDENTIAL, 4 sections, 6 action items, confidence 0.72.

  - task: "Evolutionary Kernel — preserved across transformation"
    implemented: true
    working: true
    file: "/app/backend/kernel.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Kernel module survived the rewrite. Still mounted at /api/kernel/*.
          LLM system prompt updated to reference "Omni Wake intelligence".

frontend:
  - task: "Theme rewrite — Gold + Navy enterprise palette"
    implemented: true
    working: true
    file: "/app/frontend/src/theme/colors.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Gold (#C5A559 / #FFD700) on Navy (#0A1628 / #1B2838 / #1E3A5F). Verified via Onboarding screenshot — gold accents, navy depths, ivory text."

  - task: "Onboarding (Secure Ingress) screen"
    implemented: true
    working: true
    file: "/app/frontend/app/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Full crest-row header, EN/ES toggle, "Welcome, Operator." headline,
          Full Name + Enterprise Email inputs, AUTHORISE INGRESS primary button,
          CONTINUE AS TIER-1 OPERATOR fallback, ownership footer.
          Screenshot at /tmp/omw_FORM.png confirms beautiful render.

  - task: "Tabs layout — Capture / Blueprints / Custody / Settings"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/_layout.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Bottom tabs with gold/tertiary colour scheme, Courier labels in uppercase, biometric-aware icons."

  - task: "Capture (Thought Capture) screen"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/capture.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Three-mode pill selector (TEXT / AUDIO / HYBRID), title + body +
          tags inputs, REC/STOP button (timer only — native audio recording
          requires a device build; UI captures duration), INGEST primary
          action. testIDs: capture-screen, capture-mode-*, capture-record,
          capture-submit.

  - task: "Blueprints (Gallery + Synthesis) screen"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/blueprints.tsx, /app/frontend/app/blueprint/[id].tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Multi-select thought list (max 12), SYNTHESISE SELECTED primary
          button → calls /api/blueprints/synthesise (Sonnet 4.5) → routes
          to /blueprint/[id]. Blueprint card shows classification pill
          (OMEGA / CONFIDENTIAL / INTERNAL / PUBLIC) + confidence %. Detail
          screen renders summary, all sections, action items, pin / delete.

  - task: "Custody (Secure Data Custody dashboard)"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/custody.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          BiometricGate-wrapped dashboard. Shows operator name + email +
          clearance pill (TIER-1 / TIER-2 / OMEGA), counters (thoughts,
          blueprints, pinned), classification bar chart, security posture
          (AES-256-GCM, Secure Enclave, SOC 2 / GDPR), 20-item activity log.

  - task: "Settings — Operator Profile + Kernel link + Vault Key fp"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/settings.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Language toggle, Biometric Lock switch (calls /api/ingress/settings),
          Vault Key Fingerprint (12-hex SHA-256 of on-device AES-256 key),
          Evolutionary Kernel link → /kernel, operator name/email/clearance
          card, END SESSION danger button.

  - task: "i18n — full EN/ES dictionary for Omni Wake vocabulary"
    implemented: true
    working: true
    file: "/app/frontend/src/i18n/translations.ts"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Complete dictionary covering ingress, capture, blueprints, custody, settings, kernel, biometric gate."

  - task: "AppContext — Operator model + bootstrap"
    implemented: true
    working: true
    file: "/app/frontend/src/context/AppContext.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Replaced User with Operator. Exposes both `operator` and back-compat
          `user` alias so the Evolutionary Kernel hooks keep working. Bootstrap
          calls /api/ingress/bootstrap with a device-bound id.

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 5
  run_ui: true

test_plan:
  current_focus:
    - "Backend rewrite — Oracle AI Ingestion API"
    - "Onboarding (Secure Ingress) screen"
    - "Capture (Thought Capture) screen"
    - "Blueprints (Gallery + Synthesis) screen"
    - "Custody (Secure Data Custody dashboard)"
    - "Settings — Operator Profile + Kernel link + Vault Key fp"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      ALL legacy "One Click Transcript" code purged. Replaced with the
      "Omni Wake intelligence" platform — Oracle AI thought capture →
      strategic blueprint synthesis via Claude Sonnet 4.5 → secure data
      custody dashboard. Gold/Navy executive palette throughout.

      Preserved (intentionally) so TestFlight stays green:
        • Expo slug
        • iOS bundleIdentifier
        • ASC App ID 6778347603
        • Evolutionary Kernel (frontend + backend)
        • BiometricGate, vaultKey (SecureStore AES-256)
        • eas.json hardened submit block

      Smoke-tested end-to-end via curl: bootstrap → create thought →
      synthesise → Oracle returned a real blueprint titled "Q3 Latin
      America Expansion Strategy" with classification CONFIDENTIAL, 4
      sections, 6 action items, confidence 0.72.

      Frontend bundles clean, Secure Ingress screen verified visually
      via screenshot at /tmp/omw_FORM.png.

      Asks of the testing agent:
      1. Backend — exercise every NEW /api/ingress/*, /api/thoughts/*,
         /api/blueprints/*, /api/custody/* route end-to-end. Confirm Oracle
         synthesis returns the documented JSON shape. Confirm /api/kernel/*
         still healthy. Confirm legacy /api/idme/*, /api/agent/*,
         /api/vault/*, /api/share/*, /api/security/* return 404 (intentional).
      2. Frontend — bootstrap to Capture tab, create a thought, navigate to
         Blueprints, multi-select that thought, tap SYNTHESISE SELECTED,
         confirm navigation to /blueprint/{id} with a rendered blueprint.
         Open Custody tab, confirm counters and activity log. Open
         Settings, confirm Vault Key Fingerprint + Kernel link visible.
