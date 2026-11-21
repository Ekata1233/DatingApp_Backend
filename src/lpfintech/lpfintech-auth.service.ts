import axios from "axios";

import { getLpFintechConfig } from "../config/lpfintech.config";
import { describeProviderBody, LpFintechAuthError } from "./lpfintech.errors";



let cachedToken: string | null = null;
let expiresAt = 0;
let pendingRequest: Promise<string> | null = null;

const DEFAULT_TOKEN_TTL_SECONDS = 5 * 60;

type Obj = Record<string, unknown>;

const asObj = (v: unknown): Obj =>
  v && typeof v === "object" ? (v as Obj) : {};

const firstString = (...values: unknown[]): string | null => {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
};

// LP Fintech wraps responses as { code, status, message, data: {...} }.
// The exact token field name isn't documented in what we have, so accept
// the common shapes instead of only OAuth's `access_token`.
const extractToken = (body: unknown): string | null => {
  const b = asObj(body);
  const d = asObj(b.data);

  const raw = firstString(
    d.token,
    d.accessToken,
    d.access_token,
    d.jwt,
    d.jwtToken,
    b.token,
    b.accessToken,
    b.access_token
  );

  // Some APIs return "Bearer xxx" - we add "Bearer " ourselves later.
  return raw ? raw.replace(/^Bearer\s+/i, "") : null;
};

const extractExpirySeconds = (body: unknown, token: string): number | null => {
  const b = asObj(body);
  const d = asObj(b.data);

  for (const v of [d.expires_in, d.expiresIn, b.expires_in, b.expiresIn]) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }

  // Docs say this is a JWT, so read its `exp` claim as a fallback.
  const payload = token.split(".")[1];
  if (payload) {
    try {
      const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      const exp = Number(claims?.exp);
      if (Number.isFinite(exp)) {
        const seconds = exp - Math.floor(Date.now() / 1000);
        if (seconds > 0) return seconds;
      }
    } catch {
      // not a decodable JWT - fall through
    }
  }

  return null;
};

const fetchAccessToken = async (): Promise<string> => {
  const config = getLpFintechConfig();

  let response;
  try {
    // As per LP Fintech docs: POST {{host_url}}/apibanking/api/v1/auth/token
    // with ONLY the header "Authorization: Basic base64(clientId:clientSecret)".
    // No grant_type / form body (that was OAuth-style and not in their docs).
    response = await axios.post(config.tokenUrl, undefined, {
      timeout: 15000,
      headers: {
        Accept: "application/json",
        Authorization: config.basicAuthorization,
      },
      validateStatus: () => true,
    });
  } catch (error: unknown) {
    const code = axios.isAxiosError(error) ? error.code : undefined;
    console.error("[LPFINTECH][token] network error:", code ?? error);

    throw new LpFintechAuthError(
      code === "ECONNABORTED" || code === "ETIMEDOUT"
        ? "LP Fintech token request timed out"
        : "Unable to connect to LP Fintech token API",
      code === "ECONNABORTED" || code === "ETIMEDOUT" ? 504 : 502
    );
  }

  const providerInfo = describeProviderBody(response.data);

  if (response.status < 200 || response.status >= 300) {
    // Real provider status + message in logs - this is what tells you
    // whether it is an IP-whitelist problem or wrong credentials.
    console.error(
      `[LPFINTECH][token] HTTP ${response.status} from ${config.tokenUrl} :: ${providerInfo}`
    );

    if (response.status === 403) {
      throw new LpFintechAuthError(
        `LP Fintech token API returned 403 (${providerInfo || "Forbidden"}). ` +
          "Check that this server's public IP is whitelisted and the Client ID/Secret are active."
      );
    }

    if (response.status === 401) {
      throw new LpFintechAuthError(
        `LP Fintech token API returned 401 (${providerInfo || "Unauthorized"}). ` +
          "Client ID or Client Secret is wrong or inactive."
      );
    }

    throw new LpFintechAuthError(
      `LP Fintech token API returned HTTP ${response.status} (${providerInfo})`
    );
  }

  const token = extractToken(response.data);

  if (!token) {
    console.error(
      "[LPFINTECH][token] 2xx but no token found. Response keys:",
      Object.keys(asObj(response.data)),
      "data keys:",
      Object.keys(asObj(asObj(response.data).data)),
      "::",
      providerInfo
    );
    throw new LpFintechAuthError(
      `LP Fintech token response did not contain a token (${providerInfo})`
    );
  }

  const expirySeconds =
    extractExpirySeconds(response.data, token) ?? DEFAULT_TOKEN_TTL_SECONDS;
  const safetyWindow = Math.min(30, expirySeconds / 10);

  cachedToken = token;
  expiresAt = Date.now() + Math.max(0, expirySeconds - safetyWindow) * 1000;

  return token;
};

export const invalidateLpFintechToken = (): void => {
  cachedToken = null;
  expiresAt = 0;
};

export const getLpFintechAccessToken = async (): Promise<string> => {
  if (cachedToken && expiresAt > Date.now()) {
    return cachedToken;
  }

  if (!pendingRequest) {
    pendingRequest = fetchAccessToken().finally(() => {
      pendingRequest = null;
    });
  }

  return pendingRequest;
};