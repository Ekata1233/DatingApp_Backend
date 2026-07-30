import { StoreFeatureType, StoreItemType, StorePackBadge } from "@prisma/client";

export interface CreateStoreFeatureDTO {
  itemType: StoreItemType;
  feature: StoreFeatureType;
  title: string;
  description?: string;
  intValue?: number;
  decimalValue?: number;
  boolValue?: boolean;
  unit?: string;
  enabled?: boolean;
  premiumFree?: boolean;
}

export interface CreateStorePackDTO {
  itemType: StoreItemType;
  title: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  badge?: StorePackBadge;
  sortOrder?: number;
  isActive?: boolean;
}