export interface ILaunchConfigPayload {
  waitlistEnabled?: boolean;
  appLaunched?: boolean;
  launchDate?: Date;

  originalPrice?: number;
  discountAmount?: number;
  finalPrice?: number;

  welcomeCoins?: number;

  perks?: {
    title: string;
    subtitle: string;
    value: number;
  }[];

  totalBenefitsValue?: number;

  description?: string;
}