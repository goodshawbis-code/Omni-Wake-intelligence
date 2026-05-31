#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Phase 1 — Vault Sprint: TestFlight-Ready Security Core.
  1. Production-grade eas.json with development/preview/production profiles.
  2. expo-local-authentication "Security Gate" intercepts the Academic Vault.
  3. AES-256 vault key bridged to SecureStore (lazy generate / rotate / wipe).
  4. ID.me OIDC swapped from mock to a real Authorization-Code + PKCE flow
     (with graceful fallback when client id is absent).
  5. app.json updated with bundle identifier, scheme, Face ID usage, biometric
     permission, and plugin entries for expo-local-authentication + expo-secure-store.

backend:
  - task: "Existing One Click Transcript APIs (vault, agent, idme, share, security)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "No backend code changes this iteration; Phase 1 is frontend-only. Retest to confirm prior endpoints still healthy after env / app.json updates."

frontend:
  - task: "eas.json multi-profile build config"
    implemented: true
    working: "NA"
    file: "/app/eas.json"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "development/preview/production profiles with channel + ios.resourceClass. production sets EXPO_PUBLIC_IDME_ENV=production. No runtime to test — config-only."

  - task: "BiometricGate wrapping the Vault"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/BiometricGate.tsx, /app/frontend/app/(tabs)/vault.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Gate renders web fallback banner when Platform.OS==='web' or biometrics not enrolled, otherwise shows full lock screen. Auto-prompts on focus when user.biometric_lock is true. Verify: (a) vault loads with banner when biometric_lock enabled in Settings on web preview, (b) vault loads without banner when lock disabled, (c) BiometricGate does not crash, (d) testID biometric-unavailable-banner appears when locked + web."

  - task: "SecureStore AES-256 vault key bridge"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/security/vaultKey.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "getVaultKey lazily generates a 32-byte AES key via expo-crypto, persists to SecureStore through storage.secureSet, exposes rotate / wipe / fingerprint. Native-only behaviour — not exposed in UI this iteration. Static check only."

  - task: "ID.me production OIDC (PKCE) module"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/security/idme.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "isProductionConfigured() returns false when EXPO_PUBLIC_IDME_CLIENT_ID missing → current state keeps existing mock bridge UI. runIdMeOIDC throws a clear error when called without a client id. Switches between sandbox / production endpoints via EXPO_PUBLIC_IDME_ENV. Live OIDC handshake cannot be tested without a real client id."

  - task: "app.json — bundleId, scheme, plugins, permissions"
    implemented: true
    working: true
    file: "/app/frontend/app.json"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "scheme: oneclicktranscript, bundleIdentifier com.brickoutdoorliving.oneclicktranscript, NSFaceIDUsageDescription set, android permissions USE_BIOMETRIC/USE_FINGERPRINT, plugins added for expo-local-authentication + expo-secure-store. Expo bundles clean (verified via screenshot)."

metadata:
  created_by: "main_agent"
  version: "1.3"
  test_sequence: 3
  run_ui: true

test_plan:
  current_focus:
    - "BiometricGate wrapping the Vault"
    - "Existing One Click Transcript APIs (vault, agent, idme, share, security)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Phase 1 Vault Sprint complete on the frontend. Files added:
      • /app/eas.json (dev / preview / production profiles)
      • /app/frontend/src/security/biometric.ts
      • /app/frontend/src/security/vaultKey.ts
      • /app/frontend/src/security/idme.ts
      • /app/frontend/src/components/BiometricGate.tsx
      Files modified:
      • /app/frontend/app/(tabs)/vault.tsx (wrapped in <BiometricGate>)
      • /app/frontend/app.json (scheme, bundleId, plugins, permissions, FaceID
        usage string)
      Frontend bundles clean (verified via screenshot at /tmp/oct_home.png).
      No backend changes this iteration.

      Testing focus:
      1. BACKEND: smoke test the prior One Click Transcript endpoints to confirm
         nothing regressed (users bootstrap, idme verify, agent portals search,
         agent discovery, vault list, share create + view + revoke, security
         dashboard).
      2. FRONTEND: confirm the vault tab still renders on web preview, and the
         BiometricGate shows the yellow "unavailable on web preview" banner
         when biometric_lock is toggled on in Settings. Confirm bundle has no
         errors. Skip native FaceID — that requires a real device build.

      Note: live ID.me OIDC and real biometric prompts cannot be exercised here
      — they require a development/production native build and ID.me credentials.