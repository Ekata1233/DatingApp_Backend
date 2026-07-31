import { PurchasePaymentMethod, StoreItemType, TransactionSource, TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { creditRoseHandler } from "./creditRose.handler";
import { creditBoostHandler } from "./creditBoost.handler";
import { creditComplimentHandler } from "./creditCompliment.handler";
import { creditDatePlanHandler } from "./creditDatePlan.handler";

export async function walletPurchaseService(
  userId: string,
  storePack: any
) {

  console.log("enter in wallet function");
  return prisma.$transaction(async (tx) => {

    /**
     * STEP 1
     * Get Wallet
     */
    const wallet = await tx.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    /**
     * STEP 2
     * Validate Balance
     */
    if (wallet.balance.toNumber() < Number(storePack.totalPrice)) {
      throw new Error("Insufficient wallet balance");
    }

    /**
     * STEP 3
     * Deduct Wallet
     */

    const balanceBefore = wallet.balance;
    const purchaseAmount = Number(storePack.totalPrice);
    const balanceAfter = Number(balanceBefore) - purchaseAmount;

    await tx.wallet.update({
      where: {
        userId,
      },
      data: {
        balance: {
          decrement: purchaseAmount,
        },
      },
    });

    /**
     * STEP 4
     * Create Wallet Transaction
     */

    const walletTxn = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: purchaseAmount,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.SUCCESS,
        source: TransactionSource.BOOST_PURCHASE, // Change dynamically
        description: `Purchased ${storePack.name}`,
        balanceBefore,
        balanceAfter,
      },
    });

    /**
     * STEP 6
     * Dispatch Item
     */
    switch (storePack.itemType) {

      case StoreItemType.ROSE:
        await creditRoseHandler({
          tx,
          userId,
          storePack,
          paymentMethod: PurchasePaymentMethod.WALLET,
          walletTransactionId: walletTxn.id,
          paymentId: undefined
        });
        break;

      case StoreItemType.BOOST:
        await creditBoostHandler({
          tx,
          userId,
          storePack,
          paymentMethod: PurchasePaymentMethod.WALLET,
          walletTransactionId: walletTxn.id,
          paymentId: undefined
        });
        break;

      case StoreItemType.COMPLIMENT:
        await creditComplimentHandler({
          tx,
          userId,
          storePack,
          paymentMethod: PurchasePaymentMethod.WALLET,
          walletTransactionId: walletTxn.id,
          paymentId: undefined
        });
        break;

      case StoreItemType.DATE_PLAN:
        await creditDatePlanHandler({
          tx,
          userId,
          storePack,
          paymentMethod: PurchasePaymentMethod.WALLET,
          walletTransactionId: walletTxn.id,
          paymentId: undefined
        });
        break;


      default:
        throw new Error("Unsupported store item");
    }

    /**
     * STEP 7
     * Success Response
     */
    return {
      success: true,
      paymentMethod: "WALLET",
      message: "Purchase completed successfully",
    };

  });
}