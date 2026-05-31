/**
 * ID.me OIDC — Production Bridge
 *
 * When `EXPO_PUBLIC_IDME_CLIENT_ID` is configured, this module runs the full
 * Authorization Code + PKCE flow against ID.me's OIDC endpoints and returns
 * the verified `full_name` + `student_email` claims to the bridge UI.
 *
 * When the client id is empty (current state — no live ID.me credentials
 * provisioned yet), `isProductionConfigured` returns false and the UI keeps
 * using the mocked bridge form. Drop a real client id into the build env
 * (eas.json env block) to flip the production flow on with zero code change.
 *
 * Sandbox vs production endpoints are switched by `EXPO_PUBLIC_IDME_ENV`.
 */
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const ENV = (process.env.EXPO_PUBLIC_IDME_ENV ?? "sandbox").toLowerCase();
const CLIENT_ID = process.env.EXPO_PUBLIC_IDME_CLIENT_ID ?? "";
// Discovery is well-known on ID.me. We hard-code endpoints because their
// .well-known JSON varies between sandbox and prod.
const ENDPOINTS = {
  sandbox: {
    authorization: "https://api.idmelabs.com/oauth/authorize",
    token: "https://api.idmelabs.com/oauth/token",
    userinfo: "https://api.idmelabs.com/api/public/v3/attributes.json",
  },
  production: {
    authorization: "https://api.id.me/oauth/authorize",
    token: "https://api.id.me/oauth/token",
    userinfo: "https://api.id.me/api/public/v3/attributes.json",
  },
} as const;

const ACTIVE = ENV === "production" ? ENDPOINTS.production : ENDPOINTS.sandbox;

const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: "oneclicktranscript",
  path: "idme/callback",
});

export function isProductionConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

export type IdMeClaims = {
  full_name: string;
  student_email: string;
  raw: unknown;
};

/**
 * Runs the full OIDC flow. Returns claims on success, or null on user cancel.
 * Throws with a descriptive message on misconfiguration or token exchange
 * failures so the calling UI can surface the issue.
 */
export async function runIdMeOIDC(): Promise<IdMeClaims | null> {
  if (!isProductionConfigured()) {
    throw new Error(
      "ID.me production client id is not configured. Set EXPO_PUBLIC_IDME_CLIENT_ID in eas.json.",
    );
  }

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes: ["openid", "student"],
    redirectUri: REDIRECT_URI,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: { policy: "student" },
  });

  const result = await request.promptAsync({
    authorizationEndpoint: ACTIVE.authorization,
  });

  if (result.type !== "success" || !result.params.code) {
    if (result.type === "cancel" || result.type === "dismiss") return null;
    throw new Error(`ID.me auth failed: ${result.type}`);
  }

  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      code: result.params.code,
      redirectUri: REDIRECT_URI,
      extraParams: request.codeVerifier
        ? { code_verifier: request.codeVerifier }
        : undefined,
    },
    { tokenEndpoint: ACTIVE.token },
  );

  if (!tokenResult.accessToken) {
    throw new Error("ID.me did not return an access token");
  }

  // Fetch the verified attributes (server should also re-validate the
  // id_token against ID.me's JWKS — see backend /api/idme/verify).
  const userRes = await fetch(ACTIVE.userinfo, {
    headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
  });
  if (!userRes.ok) {
    throw new Error(`ID.me userinfo failed: HTTP ${userRes.status}`);
  }
  const claims = (await userRes.json()) as Record<string, unknown>;

  // ID.me returns `attributes` blocks; we lift the standard student profile.
  const attrs = (claims.attributes || claims) as Record<string, unknown>;
  const get = (k: string) =>
    typeof attrs[k] === "string" ? (attrs[k] as string) : "";

  const full_name =
    get("fname") && get("lname")
      ? `${get("fname")} ${get("lname")}`.trim()
      : get("name") || get("full_name") || "";
  const student_email =
    get("email") || get("student_email") || get("school_email") || "";

  return { full_name, student_email, raw: claims };
}
