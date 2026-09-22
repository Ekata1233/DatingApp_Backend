import axios from "axios";

const GRIDLINES_BASE_URL =
  process.env.GRIDLINES_BASE_URL ||
  "https://api.gridlines.io/ccrv-api";

const getGridlinesHeaders = () => {

  const apiKey = process.env.GRIDLINES_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GRIDLINES_API_KEY_NOT_CONFIGURED"
    );
  }

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    "X-Auth-Type": "API-Key",
  };

};

export interface GenerateCCRVPayload {

  name: string;

  address: string;

  father_name?: string;

  additional_address?: string;

  date_of_birth?: string;

  consent: "Y";

}

// -----------------------------------------
// Generate CCRV Report
// -----------------------------------------

export const generateCCRVReport = async (
  payload: GenerateCCRVPayload
) => {

  const response = await axios.post(

    `${GRIDLINES_BASE_URL}/ccrv-api/generate-report`,

    payload,

    {
      headers: getGridlinesHeaders(),
      timeout: 30000,
    }

  );

  return response.data;

};

// -----------------------------------------
// Fetch CCRV Report
// -----------------------------------------

export const fetchCCRVReport = async (
  transactionId: string
) => {

  const response = await axios.get(

    `${GRIDLINES_BASE_URL}/fetch-report`,

    {
      headers: {

        ...getGridlinesHeaders(),

        "X-Transaction-ID": transactionId,

      },

      timeout: 30000,

    }

  );

  return response.data;

};