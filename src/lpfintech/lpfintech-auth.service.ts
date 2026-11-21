
import axios from "axios";
import { getLpFintechConfig } from "../config/lpfintech.config";

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number | string;
}

export class LpFintechAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LpFintechAuthError";
  }
}

let cachedToken: string | null = null;
let expiresAt = 0;
let pendingRequest: Promise<string> | null = null;

const fetchAccessToken = async (): Promise<string> => {
  const config = getLpFintechConfig();

  const basicCredentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
    "utf8"
  ).toString("base64");

  try {
    const response = await axios.post<TokenResponse>(
      config.tokenUrl,
      new URLSearchParams({
        grant_type: "client_credentials",
      }).toString(),
      {
        timeout: 15000,
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicCredentials}`,
        },
      }
    );

    const data = response.data;

    if (
      typeof data?.access_token !== "string" ||
      !data.access_token.trim()
    ) {
      throw new LpFintechAuthError(
        "Token response does not contain access_token"
      );
    }

    if (
      data.token_type &&
      data.token_type.toLowerCase() !== "bearer"
    ) {
      throw new LpFintechAuthError(
        "Unsupported access token type"
      );
    }

    const expirySeconds = Number(data.expires_in);

    // If no expiry is supplied, don't reuse the token.
    if (
      Number.isFinite(expirySeconds) &&
      expirySeconds > 0
    ) {
      const safetyWindow = Math.min(
        30,
        expirySeconds / 10
      );

      expiresAt =
        Date.now() +
        Math.max(0, expirySeconds - safetyWindow) * 1000;
    } else {
      expiresAt = 0;
    }

    cachedToken = data.access_token.trim();

    return cachedToken;
  } catch (error: unknown) {
    if (error instanceof LpFintechAuthError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      throw new LpFintechAuthError(
        error.response?.status === 401 ||
        error.response?.status === 403
          ? "LP Fintech rejected Client ID or Client Secret"
          : "Unable to generate LP Fintech access token"
      );
    }

    throw new LpFintechAuthError(
      "Unexpected LP Fintech authentication error"
    );
  }
};

export const invalidateLpFintechToken = (): void => {
  cachedToken = null;
  expiresAt = 0;
};

export const getLpFintechAccessToken =
  async (): Promise<string> => {
    if (
      cachedToken &&
      expiresAt > Date.now()
    ) {
      return cachedToken;
    }

    if (!pendingRequest) {
      pendingRequest = fetchAccessToken().finally(() => {
        pendingRequest = null;
      });
    }

    return pendingRequest;
  };
