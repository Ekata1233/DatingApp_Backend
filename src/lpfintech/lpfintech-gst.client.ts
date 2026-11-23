import axios, { AxiosResponse } from "axios";

import {
  getLpFintechAccessToken,
  invalidateLpFintechToken,
} from "./lpfintech-auth.service";
import { LpFintechError, describeProviderBody } from "./lpfintech.errors";
import { LpFintechGstResponse } from "../features/event-partner/verification/orgnizer/gst/gst-verification.types";
import { getLpFintechConfig } from "../config/lpfintech.config";

// Re-exported so existing imports from this file keep working.
export { LpFintechError } from "./lpfintech.errors";

const callGstApi = async (
  gstin: string,
  clientTransactionId: string,
  accessToken: string
): Promise<AxiosResponse<LpFintechGstResponse>> => {
  const config = getLpFintechConfig();

  try {
    return await axios.post<LpFintechGstResponse>(
      config.gstUrl,
      { clientTransactionId, gstin },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          // Verification APIs: plain Base64 value, NOT "Basic ..."
          // (sending "Basic xxx" here caused VAL_EXT_001 Invalid Base64 encoding)
          Authorization: config.apiAuthorization,
          "X-Access-Token": `Bearer ${accessToken}`,
        },
        validateStatus: () => true,
      }
    );
  } catch (error: unknown) {
    const code = axios.isAxiosError(error) ? error.code : undefined;
    console.error("[LPFINTECH][gst] network error:", code ?? error);

    if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
      throw new LpFintechError(504, "LP Fintech request timed out");
    }
    throw new LpFintechError(502, "Unable to connect to LP Fintech");
  }
};

export const requestLpFintechGstVerification = async (
  gstin: string,
  clientTransactionId: string
): Promise<LpFintechGstResponse> => {
  // Token errors are LpFintechAuthError (a subclass of LpFintechError),
  // so the service turns them into a proper 502/504 instead of a 500.
  let accessToken = await getLpFintechAccessToken();
  let response = await callGstApi(gstin, clientTransactionId, accessToken);

  // Token may have expired early - get a fresh one and retry ONCE.
  // Don't retry when the problem is the Authorization header format
  // (VAL_EXT_001) - a new token can't fix that.
  const firstInfo = describeProviderBody(response.data);
  const isHeaderFormatError = /VAL_EXT_001|base64/i.test(firstInfo);

  if ((response.status === 401 || response.status === 403) && !isHeaderFormatError) {
    console.warn(
      `[LPFINTECH][gst] HTTP ${response.status}, retrying with a fresh token :: ${firstInfo}`
    );
    invalidateLpFintechToken();
    accessToken = await getLpFintechAccessToken();
    response = await callGstApi(gstin, `${clientTransactionId}_r1`, accessToken);
  }

  const providerInfo = describeProviderBody(response.data);

  if (response.status === 401 || response.status === 403) {
    invalidateLpFintechToken();
    console.error(`[LPFINTECH][gst] HTTP ${response.status} :: ${providerInfo}`);
    throw new LpFintechError(
      502,
      `LP Fintech rejected GST API request (HTTP ${response.status}: ${providerInfo || "no details"})`
    );
  }

  if (response.status === 429) {
    throw new LpFintechError(503, "LP Fintech rate limit reached");
  }

  if (response.status < 200 || response.status >= 300) {
    console.error(`[LPFINTECH][gst] HTTP ${response.status} :: ${providerInfo}`);
    throw new LpFintechError(
      502,
      `LP Fintech returned HTTP ${response.status}${providerInfo ? ` (${providerInfo})` : ""}`
    );
  }

  if (!response.data || typeof response.data !== "object") {
    throw new LpFintechError(502, "Invalid LP Fintech response");
  }

  return response.data;
};