export type GooglePlayPackageInput = {
  priceId: string;
  paymentMethod: "GOOGLE_PLAY";
  productId: string;
  orderId?: string;
  purchaseToken: string;
};