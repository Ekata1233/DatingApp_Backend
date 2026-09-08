export interface MembershipPaymentMethod {
  type: "UPI" | "CARD" | "WALLET" | "OTHER" | null;
  displayValue: string | null;
}

export interface MembershipCurrentPlan {
  userPackageId: string;
  packageId: string;

  name: string;
  slug: string;
  tagline: string | null;

  billingCycle: string;
  months: number | null;

  status: string;

  startDate: Date;
  endDate: Date | null;

  renewsOn: Date | null;
  autoRenew: boolean;

  amount: number;

  paymentMethod: MembershipPaymentMethod;
}

export interface MembershipPlanHistoryItem {
  userPackageId: string;

  packageId: string;
  name: string;
  slug: string;

  billingCycle: string;
  months: number | null;

  purchasedAt: Date;
  startDate: Date;
  endDate: Date | null;

  status: string;

  amount: number;
  originalPrice: number | null;
  discountPercent: number | null;

  paymentMethod: MembershipPaymentMethod;

  paymentId: string | null;
  transactionId: string | null;

  invoiceAvailable: boolean;
  invoiceUrl: string | null;
}