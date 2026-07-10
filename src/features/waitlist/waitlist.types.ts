export interface JoinWaitlistInput {
  paymentId: string;
  source?: "INSTAGRAM" | "FACEBOOK" | "GOOGLE" | "WEBSITE" | "REFERRAL" | "YOUTUBE" | "LINKEDIN" | "OTHER";
}