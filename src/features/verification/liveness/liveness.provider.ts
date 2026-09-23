
import { randomUUID } from "crypto";
import { gridlinesClient } from "../../../utils/gridlines.client";


export interface LivenessResult {
  isLive: boolean;
  confidence: number;
  providerCode: string;
  providerRequestId: string;
  transactionId: string;
  referenceId: string;
}

export const verifyLivenessWithGridlines = async (
  selfieBuffer: Buffer
): Promise<LivenessResult> => {

  const threshold = Number(
    process.env.LIVENESS_THRESHOLD ?? "0.5"
  );

  if (
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 1
  ) {
    throw new Error("INVALID_LIVENESS_THRESHOLD");
  }

  const referenceId = randomUUID();

  // Convert selfie to base64
  const base64Image = selfieBuffer.toString("base64");

  // Call Gridlines Passive Liveness API
  const response = await gridlinesClient.post(
    "/liveness/passive-check",
    {
      base64_data: base64Image,
      consent: "Y",
    },
    {
      headers: {
        "X-Reference-ID": referenceId,
      },
    }
  );

  const result = response.data;

  const code = String(result?.data?.code ?? "");

  const confidence = result?.data?.confidence;

  if (
    result?.status !== 200 ||
    !["1000", "1001"].includes(code) ||
    typeof confidence !== "number" ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw new Error("INVALID_LIVENESS_RESPONSE");
  }

  const isLive =
    code === "1000" &&
    confidence >= threshold;

  return {
    isLive,
    confidence,
    providerCode: code,
    providerRequestId: result.request_id,
    transactionId: result.transaction_id,
    referenceId,
  };
};