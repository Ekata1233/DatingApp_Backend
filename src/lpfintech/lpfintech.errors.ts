// Shared LP Fintech error classes.
// Kept in one file so the auth service and GST client don't import each other.

export class LpFintechError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "LpFintechError";
  }
}

// Thrown when the token API fails. Extends LpFintechError so the GST service
// maps it to a proper HTTP status instead of a 500 "Internal server error".
export class LpFintechAuthError extends LpFintechError {
  constructor(message: string, statusCode = 502) {
    super(statusCode, message);
    this.name = "LpFintechAuthError";
  }
}

// Extracts LP Fintech's own error code/message from a response body,
// e.g. { code: "VAL_EXT_003", status: "Failed", message: "..." }
export const describeProviderBody = (body: unknown): string => {
  if (!body || typeof body !== "object") {
    return typeof body === "string" ? body.slice(0, 300) : "";
  }

  const b = body as Record<string, unknown>;
  const data =
    b.data && typeof b.data === "object"
      ? (b.data as Record<string, unknown>)
      : {};

  const parts = [b.code, b.status, b.message, data.responseMessage]
    .filter((v) => typeof v === "string" || typeof v === "number")
    .map(String);

  return parts.join(" | ").slice(0, 300);
};