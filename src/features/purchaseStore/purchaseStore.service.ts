import { PurchasePaymentMethod, PaymentPurpose } from "@prisma/client";
import { createPaymentLink } from "../payment/payment.service";
import { CreatePurchaseDto } from "./purchaseStore.types";
import { prisma } from "../../prisma/prismaClient";
import { walletPurchaseService } from "./handlers/wallet.handler";

export async function createPurchaseService(
    userId: string,
    body: CreatePurchaseDto
) {

    console.log("user id ", userId)
    console.log("body : ", body)

    /**
     * STEP 2
     * Find Store Pack
     */

    const storePack = await prisma.storePack.findUnique({
        where: {
            id: body.storePackId,
        },
    });

    console.log("store pack : ", storePack);
    /**
     * STEP 3
     * Validate Store Pack
     */

    if (!storePack) {
        throw new Error("Store pack not found.");
    }

    if (!storePack.isActive) {
        throw new Error("Store pack is inactive.");
    }

    /**
     * STEP 4
     * Validate Price
     *
     * Never trust frontend.
     */

    const amount = Number(storePack.totalPrice);

    if (amount <= 0) {
        throw new Error("Invalid pack price.");
    }

    console.log("amount : ", amount)
    /**
     * STEP 5
     * Check Payment Method
     */

    switch (body.paymentMethod) {

        case PurchasePaymentMethod.WALLET:

            return walletPurchaseService(userId, storePack);

        case PurchasePaymentMethod.PAYMENT_GATEWAY:

            return createPaymentLink(userId, {
                purpose: PaymentPurpose.OTHER,
                storePackId: storePack.id,
                amount,
                description: storePack.title,
            });

        default:

            throw new Error("Unsupported payment method.");
    }
}
