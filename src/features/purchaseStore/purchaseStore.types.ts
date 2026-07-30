// purchaseStore.types.ts



export interface CreatePurchaseDto {
  /**
   * Store pack selected by the user
   */
  storePackId: string;

  /**
   * Payment method selected by the user
   */
  paymentMethod: PaymentMethod;
}