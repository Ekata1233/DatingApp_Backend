export class LpFintechConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LpFintechConfigError";
  }
}

const required = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new LpFintechConfigError(`${key} is missing`);
  }

  return value;
};

const secureUrl = (value: string, name: string): string => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new LpFintechConfigError(`${name} is not a valid URL`);
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new LpFintechConfigError(`${name} must be a valid HTTPS URL`);
  }

  return url.toString();
};

export interface LpFintechConfig {
  baseUrl: string;
  tokenUrl: string;
  gstUrl: string;
  clientId: string;
  clientSecret: string;
  // TOKEN API only: "Basic base64(clientId:clientSecret)"
  basicAuthorization: string;
  // VERIFICATION APIs (GST etc.): plain base64 value, NO "Basic " prefix.
  // LP Fintech docs: "Authorization: Base64 Encoded(clientId)"
  apiAuthorization: string;
}

const b64 = (value: string): string =>
  Buffer.from(value, "utf8").toString("base64");

export const getLpFintechConfig = (): LpFintechConfig => {
  const baseUrl = secureUrl(required("LPFINTECH_BASE_URL"), "LPFINTECH_BASE_URL");
  const tokenUrl = secureUrl(required("LPFINTECH_TOKEN_URL"), "LPFINTECH_TOKEN_URL");

  const gstPath =
    process.env.LPFINTECH_GST_ADVANCED_PATH?.trim() ||
    "/apibanking/api/v1/gstinAuthenticationAdvanced";

  if (!gstPath.startsWith("/") || gstPath.startsWith("//")) {
    throw new LpFintechConfigError("Invalid LPFINTECH_GST_ADVANCED_PATH");
  }

  const gstUrl = new URL(gstPath, baseUrl);

  if (gstUrl.origin !== new URL(baseUrl).origin) {
    throw new LpFintechConfigError(
      "GST endpoint must use the configured provider origin"
    );
  }

  const clientId = required("LPFINTECH_CLIENT_ID");
  const clientSecret = required("LPFINTECH_CLIENT_SECRET");

  // Token API header (already working). Built from ID + secret, so nothing
  // goes out of sync when the secret is rotated.
  // NOTE: LPFINTECH_GST_AUTHORIZATION is no longer used - remove it from .env.
  const basicAuthorization = `Basic ${b64(`${clientId}:${clientSecret}`)}`;

  // Verification API header. Docs say Base64(clientId), without "Basic ".
  // If LP Fintech still rejects it, set LPFINTECH_API_AUTH_MODE=clientIdSecret
  // in .env to send Base64(clientId:clientSecret) instead.
  const mode = (process.env.LPFINTECH_API_AUTH_MODE?.trim() || "clientId").toLowerCase();

  if (mode !== "clientid" && mode !== "clientidsecret") {
    throw new LpFintechConfigError(
      "LPFINTECH_API_AUTH_MODE must be 'clientId' or 'clientIdSecret'"
    );
  }

  const apiAuthorization =
    mode === "clientidsecret" ? b64(`${clientId}:${clientSecret}`) : b64(clientId);

  return {
    baseUrl,
    tokenUrl,
    gstUrl: gstUrl.toString(),
    clientId,
    clientSecret,
    basicAuthorization,
    apiAuthorization,
  };
};