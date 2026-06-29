# One Click Transcript — Test Identities

The app is **device-bound** and does not use email/password authentication.
A user is bootstrapped automatically on first launch via `POST /api/users/bootstrap`
with a generated device id stored in `expo-secure-store` (or AsyncStorage on web).

## Test ID.me verification (mocked OIDC)

Use any name + email pair on the ID.me bridge screen. The backend simulates
the OIDC handshake and marks the user as `id_me_verified: true`.

Suggested seed identity for screenshots / demo:
- Full name: `Marcus T. Johnson`
- Student email: `m.johnson@uapb.edu`

## AI Liaison portal credentials (mocked)

The agent never contacts the real portals. Submit any non-empty
username/password to advance through the MFA gate. Sample creds:

| Portal | Username     | Password    | MFA      |
| ------ | ------------ | ----------- | -------- |
| UAPB   | `mjohnson`   | `Demo!2026` | Duo push |
| CSUN   | `mjohnson92` | `Demo!2026` | SMS code |

For SMS MFA, any 4-8 digit code is accepted (e.g. `123456`).
