export const AUTO_RENEW_CANCEL_REASONS = [
  "TOO_EXPENSIVE",
  "FOUND_SOMEONE",
  "TAKING_A_BREAK",
  "NOT_ENOUGH_MATCHES",
  "MISSING_FEATURES",
  "SOMETHING_ELSE",
] as const;

export type AutoRenewCancelReason =
  (typeof AUTO_RENEW_CANCEL_REASONS)[number];