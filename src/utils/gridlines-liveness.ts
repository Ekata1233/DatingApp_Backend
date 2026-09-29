import axios from "axios";

const GRIDLINES_BASE_URL = process.env.GRIDLINES_BASE_URL

export interface LivenessResult {
  code: string;
  message: string;
  confidence: number;
  requestId?: string;
  transactionId?: string;
}

export const checkPassiveLiveness = async (
  imageBase64: string,
  referenceId: string
): Promise<LivenessResult> => {
  const response = await axios.post(
    `${GRIDLINES_BASE_URL}/liveness/passive-check`,
    {
      base64_data: imageBase64,
      consent: "Y",
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": process.env.GRIDLINES_API_KEY!,
        "X-Auth-Type": "API-Key",
        "X-Reference-ID": referenceId,
      },
      timeout: 30000,
    }
  );

  const result = response.data;

  return {
    code: String(result?.data?.code ?? ""),
    message: result?.data?.message ?? "",
    confidence: Number(result?.data?.confidence ?? 0),
    requestId: result?.request_id,
    transactionId: result?.transaction_id,
  };
};