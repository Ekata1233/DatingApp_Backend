import {
    Prisma,
    PurchasePaymentMethod,
    DatePlanTransactionType,
    TransactionSource,
    TransactionStatus,
    TransactionType,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

// Update the Prisma import path as per your project.

export const purchaseDatePlanWithWalletService =
    async (
        userId: string,
        packageId: string
    ) => {

        return await prisma.$transaction(
            async (tx) => {

                // ---------------------------------------
                // 1. Validate logged-in user
                // ---------------------------------------

                const user = await tx.user.findUnique({
                    where: {
                        id: userId,
                    },

                    select: {
                        id: true,
                        account_status: true,
                    },
                });

                if (!user) {
                    throw new Error("USER_NOT_FOUND");
                }

                if (user.account_status !== "ACTIVE") {
                    throw new Error("ACCOUNT_NOT_ACTIVE");
                }

                // ---------------------------------------
                // 2. Get selected Date Plan package
                // ---------------------------------------

                const datePlanPackage =
                    await tx.datePlanPackage.findFirst({
                        where: {
                            id: packageId,
                            isActive: true,
                        },
                    });

                if (!datePlanPackage) {
                    throw new Error(
                        "DATE_PLAN_PACKAGE_NOT_FOUND"
                    );
                }

                if (
                    datePlanPackage.planCount <= 0 ||
                    datePlanPackage.price.lte(0)
                ) {
                    throw new Error(
                        "INVALID_DATE_PLAN_PACKAGE"
                    );
                }

                const purchaseAmount =
                    datePlanPackage.price;

                const planQuantity =
                    datePlanPackage.planCount;

                // ---------------------------------------
                // 3. Get user's wallet
                // ---------------------------------------

                const wallet =
                    await tx.wallet.findUnique({
                        where: {
                            userId,
                        },
                    });

                if (!wallet) {
                    throw new Error("WALLET_NOT_FOUND");
                }

                // ---------------------------------------
                // 4. Check wallet balance
                // ---------------------------------------

                if (
                    wallet.balance.lt(purchaseAmount)
                ) {
                    throw new Error(
                        "INSUFFICIENT_WALLET_BALANCE"
                    );
                }

                // ---------------------------------------
                // 5. Deduct wallet balance atomically
                // ---------------------------------------

                const walletDeduction =
                    await tx.wallet.updateMany({
                        where: {
                            id: wallet.id,

                            balance: {
                                gte: purchaseAmount,
                            },
                        },

                        data: {
                            balance: {
                                decrement: purchaseAmount,
                            },
                        },
                    });

                if (walletDeduction.count !== 1) {
                    throw new Error(
                        "INSUFFICIENT_WALLET_BALANCE"
                    );
                }

                // ---------------------------------------
                // 6. Get updated wallet balance
                // ---------------------------------------

                const updatedWallet =
                    await tx.wallet.findUniqueOrThrow({
                        where: {
                            id: wallet.id,
                        },
                    });

                // ---------------------------------------
                // 7. Create wallet transaction
                // ---------------------------------------

                const walletTransaction =
                    await tx.walletTransaction.create({
                        data: {
                            walletId: wallet.id,

                            amount: purchaseAmount,

                            type:
                                TransactionType.PURCHASE,

                            status:
                                TransactionStatus.SUCCESS,

                            source:
                                TransactionSource.WALLET_TOPUP,

                            description:
                                `Purchased ${planQuantity} Date Plans using wallet`,

                            balanceBefore:
                                wallet.balance,

                            balanceAfter:
                                updatedWallet.balance,
                        },
                    });

                // ---------------------------------------
                // 8. Create Date Plan purchase record
                // ---------------------------------------

                const datePlanPurchase =
                    await tx.datePlanPurchase.create({
                        data: {
                            userId,

                            quantity: planQuantity,

                            amount: purchaseAmount.toNumber(),
                            paymentMethod:
                                PurchasePaymentMethod.WALLET,

                            walletTransactionId:
                                walletTransaction.id,
                        },
                    });

                // ---------------------------------------
                // 9. Update Date Plan user stats
                // ---------------------------------------

                const now = new Date();

                const nextResetAt = new Date(
                    now.getTime() +
                    7 * 24 * 60 * 60 * 1000
                );

                const updatedDatePlanStats =
                    await tx.datePlanUserStats.upsert({
                        where: {
                            userId,
                        },

                        update: {
                            totalDatePlan: {
                                increment: planQuantity,
                            },

                            balance: {
                                increment: planQuantity,
                            },

                            purchasedDataPlan: {
                                increment: planQuantity,
                            },
                        },

                        create: {
                            userId,

                            totalDatePlan: planQuantity,

                            balance: planQuantity,

                            purchasedDataPlan: planQuantity,

                            weeklyLimit: 0,

                            totalDetePlanUsed: 0,

                            lastResetAt: now,

                            nextResetAt,
                        },
                    });

                // ---------------------------------------
                // 10. Create Date Plan transaction
                // ---------------------------------------

                const datePlanTransaction =
                    await tx.datePlanTransaction.create({
                        data: {
                            userId,

                            type:
                                DatePlanTransactionType.PACKAGE_CREDIT,

                            quantity: planQuantity,

                            balanceAfter:
                                updatedDatePlanStats.balance,

                            purchaseId:
                                datePlanPurchase.id,

                            description:
                                `Purchased ${planQuantity} Date Plans using wallet`,
                        },
                    });

                // ---------------------------------------
                // 11. Return purchase details
                // ---------------------------------------

                return {
                    purchaseId:
                        datePlanPurchase.id,

                    walletTransactionId:
                        walletTransaction.id,

                    datePlanTransactionId:
                        datePlanTransaction.id,

                    package: {
                        id: datePlanPackage.id,

                        title: datePlanPackage.title,

                        description:
                            datePlanPackage.description,

                        quantity: planQuantity,

                        price: purchaseAmount,

                        pricePerPlan:
                            datePlanPackage.pricePerPlan,

                        discount:
                            datePlanPackage.discount,
                    },

                    payment: {
                        method: "WALLET",

                        status: "SUCCESS",

                        amountPaid:
                            purchaseAmount,

                        balanceBefore:
                            wallet.balance,

                        balanceAfter:
                            updatedWallet.balance,
                    },

                    datePlans: {
                        purchased: planQuantity,

                        totalDatePlan:
                            updatedDatePlanStats.totalDatePlan,

                        balance:
                            updatedDatePlanStats.balance,

                        purchasedDataPlan:
                            updatedDatePlanStats.purchasedDataPlan,

                        weeklyLimit:
                            updatedDatePlanStats.weeklyLimit,

                        totalDetePlanUsed:
                            updatedDatePlanStats.totalDetePlanUsed,
                    },

                    purchasedAt:
                        datePlanPurchase.createdAt,
                };
            },
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable,

                maxWait: 5000,

                timeout: 10000,
            }
        );
    };