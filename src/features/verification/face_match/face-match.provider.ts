
import { randomUUID } from "crypto";
import { gridlinesClient } from "../../../utils/gridlines.client";


export interface FaceMatchResult {
  isMatch: boolean;
  confidence: number;
  providerCode: string;
  providerRequestId: string;
}

export const verifyFaceWithGridlines = async (
  governmentIdPhoto: Buffer,
  selfiePhoto: Buffer
): Promise<FaceMatchResult> => {

  const threshold = Number(
    process.env.FACE_MATCH_THRESHOLD ?? "0.25"
  );

  if (
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 1
  ) {
    throw new Error("INVALID_FACE_MATCH_THRESHOLD");
  }

  const referenceId = randomUUID();

  const response = await gridlinesClient.post(
    "/face-api/verify",
    {
      file_1_base64:
        governmentIdPhoto.toString("base64"),

      file_2_base64:
        selfiePhoto.toString("base64"),

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
    throw new Error("INVALID_FACE_MATCH_RESPONSE");
  }

  const isMatch =
    code === "1000" &&
    confidence >= threshold;

  return {
    isMatch,
    confidence,
    providerCode: code,
    providerRequestId: result.request_id,
  };
};