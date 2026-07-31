import { PurchasePaymentMethod } from "@prisma/client";


export interface CreatePurchaseDto {
  storePackId: string;
  paymentMethod: PurchasePaymentMethod;
}