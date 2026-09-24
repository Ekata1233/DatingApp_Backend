import axios from "axios";
import { randomUUID } from "crypto";

// ============================================
// CONFIGURATION
// ============================================

const BASE_URL = (
  process.env.GRIDLINES_BASE_URL || "https://api.gridlines.io"
).replace(/\/+$/, "");

const API_KEY = process.env.GRIDLINES_API_KEY;

const REQUEST_TIMEOUT_MS = 30000;

export type EmploymentMethod = "MOBILE" | "UAN";

// ============================================
// GRIDLINES RESPONSE CODES
// ============================================

export const GRIDLINES_CODES = {
  // Fetch UAN (by mobile)
  UAN_FETCHED: "1016",
  MOBILE_HAS_NO_UAN: "1007",

  // Fetch Latest (by UAN)
  LATEST_EMPLOYMENT_FETCHED: "1014",
  NO_EMPLOYMENT_RECORDS: "1015",
  UAN_DOES_NOT_EXIST: "1011",
} as const;

// ============================================
// TYPES
// ============================================

/**
 * One employment record as returned by
 * POST /epfo-api/employment-history/fetch-latest
 */
export interface LatestEmploymentRecord {
  name?: string;
  establishment_name: string;
  member_id?: string;
  date_of_joining?: string | null;
  date_of_exit?: string | null;
  exit_reason?: string | null;
}

/**
 * Response of POST /epfo-api/fetch-uan
 */
export interface GridlinesFetchUANResponse {
  request_id?: string;
  transaction_id?: string;
  status: number;
  data: {
    code: string;
    message: string;
    uan_list?: string[];
    uan_source?: { uan: string; source: string[] }[];
  };
  timestamp?: number;
  path?: string;
}

/**
 * Response of POST /epfo-api/employment-history/fetch-latest
 */
export interface GridlinesFetchLatestResponse {
  request_id?: string;
  transaction_id?: string;
  status: number;
  data: {
    code: string;
    message: string;
    employment_data?: LatestEmploymentRecord | LatestEmploymentRecord[];
  };
  timestamp?: number;
  path?: string;
}

// ============================================
// COMMON HEADERS
// ============================================

const getHeaders = (referenceId?: string) => {
  if (!API_KEY) {
    throw new Error("GRIDLINES_API_KEY_NOT_CONFIGURED");
  }

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    "X-Auth-Type": "API-Key",
    ...(referenceId ? { "X-Reference-ID": referenceId } : {}),
  };
};

// ============================================
// COMMON ERROR HANDLER
// ============================================

const handleGridlinesError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const providerData = error.response?.data;

    console.error("Gridlines API Error:", {
      status,
      code:
        providerData?.error?.code ??
        providerData?.data?.code ??
        providerData?.code,
      message:
        providerData?.error?.message ??
        providerData?.data?.message ??
        providerData?.message,
      requestId: providerData?.request_id,
      axiosCode: error.code,
    });

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      throw new Error("GRIDLINES_REQUEST_TIMEOUT");
    }
    if (status === 401) throw new Error("GRIDLINES_INVALID_API_KEY");
    if (status === 403) throw new Error("GRIDLINES_FORBIDDEN_ACCESS");
    if (status === 404) throw new Error("GRIDLINES_ENDPOINT_NOT_FOUND");
    if (status === 500) throw new Error("GRIDLINES_INTERNAL_SERVER_ERROR");
    if (status && status >= 500) throw new Error("GRIDLINES_SERVER_ERROR");

    throw new Error("GRIDLINES_API_REQUEST_FAILED");
  }

  throw error;
};

// ============================================
// API 1: FETCH UAN BY MOBILE
// POST /epfo-api/fetch-uan
// ============================================

export const fetchUANByMobile = async (
  mobileNumber: string,
  referenceId: string = randomUUID()
): Promise<GridlinesFetchUANResponse> => {
  const apiUrl = `${BASE_URL}/epfo-api/fetch-uan`;

  try {
    const response = await axios.post<GridlinesFetchUANResponse>(
      apiUrl,
      { mobile_number: mobileNumber, consent: "Y" },
      { headers: getHeaders(referenceId), timeout: REQUEST_TIMEOUT_MS }
    );

    console.log("Gridlines Fetch UAN:", {
      status: response.status,
      code: response.data?.data?.code,
      requestId: response.data?.request_id,
    });

    return response.data;
  } catch (error: unknown) {
    return handleGridlinesError(error);
  }
};

// ============================================
// API 2: FETCH LATEST EMPLOYMENT BY UAN
// POST /epfo-api/employment-history/fetch-latest
// ============================================

export const fetchLatestEmploymentByUAN = async (
  uan: string,
  referenceId: string = randomUUID()
): Promise<GridlinesFetchLatestResponse> => {
  const apiUrl = `${BASE_URL}/epfo-api/employment-history/fetch-latest`;

  try {
    const response = await axios.post<GridlinesFetchLatestResponse>(
      apiUrl,
      { uan, consent: "Y" },
      { headers: getHeaders(referenceId), timeout: REQUEST_TIMEOUT_MS }
    );

    console.log("Gridlines Fetch Latest:", {
      status: response.status,
      code: response.data?.data?.code,
      requestId: response.data?.request_id,
    });

    return response.data;
  } catch (error: unknown) {
    return handleGridlinesError(error);
  }
};

// ============================================
// EXTRACT LATEST EMPLOYMENT RECORD
// ============================================

/**
 * fetch-latest returns a single object in employment_data.
 * Handles the array form defensively and returns one record or null.
 */
export const extractLatestEmployment = (
  response: GridlinesFetchLatestResponse
): LatestEmploymentRecord | null => {
  const raw = response.data?.employment_data;
  if (!raw) return null;

  const record = Array.isArray(raw) ? raw[0] : raw;

  if (
    record &&
    typeof record === "object" &&
    typeof record.establishment_name === "string" &&
    record.establishment_name.trim().length > 0
  ) {
    return record;
  }

  return null;
};