export interface SendEmailOtpInput {
  email: string;
}

export interface VerifyEmailOtpInput {
  email: string;
  otp: string;
}

export interface SendEmailOtpResponse {
  email: string;
  expiresIn: number;
  resendAfter: number;
  requestId?: string;
}

export interface VerifyEmailOtpResponse {
  id: string;
  email: string | null;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
}

export const EMAIL_OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_SECONDS: 300,
  RESEND_SECONDS: 60,
  MAX_VERIFY_ATTEMPTS: 5,
  MAX_SEND_ATTEMPTS: 5,
  RATE_LIMIT_SECONDS: 3600,
} as const;

export class EmailVerificationError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "EmailVerificationError";
  }
}