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
  // "Basic base64(clientId:clientSecret)" - sent as the Authorization header
  // on the token API and on every verification API.
  basicAuthorization: string;
}

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

  // Built from ID + secret. LPFINTECH_GST_AUTHORIZATION is now OPTIONAL.
  const basicAuthorization =
    process.env.LPFINTECH_GST_AUTHORIZATION?.trim() ||
    `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;

  return {
    baseUrl,
    tokenUrl,
    gstUrl: gstUrl.toString(),
    clientId,
    clientSecret,
    basicAuthorization,
  };
};