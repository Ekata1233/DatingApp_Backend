export interface ValidateReferralRequest {
  referralCode: string;
}

export interface ValidateReferralResponse {
  success: boolean;
  message: string;
  referrerName?: string;
}