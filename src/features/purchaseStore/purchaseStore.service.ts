// purchaseStore.service.ts

import { CreatePurchaseDto } from "./purchaseStore.types";

export async function createPurchaseService(
    userId: string,
    body: CreatePurchaseDto
) {

    // 1. Validate Product
    const product = await validateProduct(body);

    // 2. Validate Price
    await validatePrice(product);

    // 3. Validate Purchase Rules
    await validatePurchaseRules(userId, product);

    // 4. Decide payment method
    switch (body.paymentMethod) {

        case PaymentMethod.WALLET:

            return walletPurchaseService(
                userId,
                product,
                body
            );

        case PaymentMethod.PAYU:

            return paymentService.createPaymentLink(
                userId,
                {
                    purpose: PaymentPurpose.PURCHASE_STORE,
                    storeItemId: product.id,
                    description: product.name
                }
            );

        default:
            throw new Error("Unsupported payment method");
    }
}