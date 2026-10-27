export type GooglePlayInput = {
  boostOptionId: string;
  paymentMethod: "GOOGLE_PLAY";
  productId: string;
  orderId?: string;
  purchaseToken: string;
};