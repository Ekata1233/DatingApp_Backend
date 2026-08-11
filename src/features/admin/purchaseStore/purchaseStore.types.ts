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

export interface CreateStoreInfoDTO {
  itemType: StoreItemType;
  title: string;
  description: string;
  tag?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

  
export interface UpdateStoreInfoDTO {
  itemType?: StoreItemType;
  title?: string;
  description?: string;
  tag?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}
export interface UpdateStorePackDTO {
  itemType?: StoreItemType;
  title?: string;
  quantity?: number;
  pricePerUnit?: number;
  totalPrice?: number;
  badge?: StorePackBadge;
  sortOrder?: number;
  isActive?: boolean;
}