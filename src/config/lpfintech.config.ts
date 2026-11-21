
export class LpFintechConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LpFintechConfigError";
  }
}

const required = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new LpFintechConfigError(
      `${key} is missing`
    );
  }

  return value;
};

const secureUrl = (value: string, name: string): string => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new LpFintechConfigError(
      `${name} is not a valid URL`
    );
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new LpFintechConfigError(
      `${name} must be a valid HTTPS URL`
    );
  }

  return url.toString();
};

export const getLpFintechConfig = () => {
  const baseUrl = secureUrl(
    required("LPFINTECH_BASE_URL"),
    "LPFINTECH_BASE_URL"
  );

  const tokenUrl = secureUrl(
    required("LPFINTECH_TOKEN_URL"),
    "LPFINTECH_TOKEN_URL"
  );

  const gstPath =
    process.env.LPFINTECH_GST_ADVANCED_PATH?.trim() ||
    "/apibanking/api/v1/gstinAuthenticationAdvanced";

  if (
    !gstPath.startsWith("/") ||
    gstPath.startsWith("//")
  ) {
    throw new LpFintechConfigError(
      "Invalid LPFINTECH_GST_ADVANCED_PATH"
    );
  }

  const gstUrl = new URL(gstPath, baseUrl);
  const baseOrigin = new URL(baseUrl).origin;

  if (gstUrl.origin !== baseOrigin) {
    throw new LpFintechConfigError(
      "GST endpoint must use the configured provider origin"
    );
  }

  return {
    baseUrl,
    tokenUrl,
    gstUrl: gstUrl.toString(),
    clientId: required("LPFINTECH_CLIENT_ID"),
    clientSecret: required("LPFINTECH_CLIENT_SECRET"),
    gstAuthorization: required(
      "LPFINTECH_GST_AUTHORIZATION"
    ),
  };
};
