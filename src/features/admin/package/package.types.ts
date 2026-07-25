import { BillingCycle, PackageType, ResetPeriod } from "@prisma/client";

export interface PriceInput {
  billingCycle: BillingCycle;
  months?: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  isHighlighted?: boolean;
  active?: boolean;
}

export interface PlanLimitInput {
  featureCode: string;
  enabled: boolean;
  unlimited: boolean;
  limit?: number | null;
  resetPeriod: ResetPeriod;
}

export interface CreatePackageDTO {
  name: PackageType;
  slug: string;
  tagline?: string;
  badgeLabel?: string;
  discoveryPool?: string;
  visibilityRule?: string;
  description?: string;
  isPopular?: boolean;
  active?: boolean;
  sortOrder?: number;
  prices: PriceInput[];
  limits: PlanLimitInput[];
}

export interface PackageResponse {
  id: string;
  name: PackageType;
  slug: string;
  tagline: string | null;
  badgeLabel: string | null;
  discoveryPool: string | null;
  visibilityRule: string | null;
  description: string | null;
  isPopular: boolean;
  active: boolean;
  sortOrder: number;
  prices: PriceResponse[];
  limits: PlanLimitResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceResponse {
  id: string;
  billingCycle: BillingCycle;
  months: number | null;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  isHighlighted: boolean;
  active: boolean;
}

export interface PlanLimitResponse {
  id: string;
  featureId: string;
  feature: {
    id: string;
    code: string;
    title: string;
    category: string;
    description: string | null;
  };
  enabled: boolean;
  unlimited: boolean;
  limit: number | null;
  resetPeriod: ResetPeriod;
}