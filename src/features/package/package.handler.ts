import { BoostType } from "@prisma/client";

export async function initializePlanUsage(
    userId: string,
    packageId: string,
    tx: any
) {
    try {
        // 1. Get package features with their limits
        console.log("user Id : ", userId)
        console.log("packageId : ", packageId)
        const packageFeatures = await tx.planLimit.findMany({
            where: {
                packageId,
                enabled: true,
            },
            include: {
                feature: true,
            },
        });

        console.log("package Features : ", packageFeatures)

        if (!packageFeatures.length) {
            console.warn(`No features found for package ${packageId}`);
            return 0;
        }

        // 2. Determine subscription tier
        const tier = determinePackageTier(packageFeatures);

        // 3. Extract weekly limits
        const rosesLimit = getFeatureLimit(packageFeatures, 'ROSES');
        const complimentsLimit = getFeatureLimit(packageFeatures, 'COMPLIMENTS');
        const boostsLimit = getFeatureLimit(packageFeatures, 'BOOSTS');
        const welcomeCoins = getFeatureLimit(packageFeatures, 'WELCOME_COINS');
        const datePlan = getFeatureLimit(packageFeatures, 'DATE_PLANS');

        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        let featuresInitialized = 0;

        // 4. Initialize Rose Balance
        if (rosesLimit > 0) {
            const existingBalance = await tx.userRoseBalance.findUnique({
                where: { userId }
            });

            const currentTotalRoses = existingBalance?.totalRoses || 0;
            const currentFreeRoses = existingBalance?.freeRoses || 0;
            const newTotalRoses = currentTotalRoses + rosesLimit;
            const newFreeRoses = currentFreeRoses + rosesLimit;

            // Create a system purchase record for tracking
            const rosePurchase = await tx.rosePurchase.create({
                data: {
                    userId,
                    quantity: rosesLimit,
                    amount: 0.00, // Free with package
                    paymentId: `PACKAGE_${packageId}_${Date.now()}`,
                    status: 'COMPLETED',
                    createdAt: now,
                }
            });

            // Create transaction record
            await tx.roseTransaction.create({
                data: {
                    userId,
                    type: 'PACKAGE_CREDIT', // or 'SUBSCRIPTION_GRANT' depending on your RoseTransactionType enum
                    quantity: rosesLimit,
                    roseBalanceAfter: newTotalRoses,
                    purchaseId: rosePurchase.id,
                    createdAt: now,
                }
            });

            // Upsert the balance
            await tx.userRoseBalance.upsert({
                where: { userId },
                create: {
                    userId,
                    totalRoses: newTotalRoses,
                    freeRoses: newFreeRoses,
                    purchasedRoses: 0,
                    weeklyLimit: rosesLimit,
                    totalRosesSent: 0,
                    lastResetAt: now,
                    nextResetAt: nextWeek,
                },
                update: {
                    totalRoses: newTotalRoses,
                    freeRoses: newFreeRoses,
                    weeklyLimit: rosesLimit,
                    lastResetAt: now,
                    nextResetAt: nextWeek,
                }
            });

            featuresInitialized++;
            console.log(`🌹 Roses initialized: ${rosesLimit}/week (Total: ${newTotalRoses})`);
        }

        // 5. Initialize Compliment Balance
        if (complimentsLimit > 0) {
            const existingBalance = await tx.userComplimentBalance.findUnique({
                where: { userId }
            });

            const currentTotalCompliments = existingBalance?.totalCompliments || 0;
            const currentFreeCompliments = existingBalance?.freeCompliments || 0;
            const newTotalCompliments = currentTotalCompliments + complimentsLimit;
            const newFreeCompliments = currentFreeCompliments + complimentsLimit;

            // Create a system purchase record for tracking
            const complimentPurchase = await tx.complimentPurchase.create({
                data: {
                    userId,
                    quantity: complimentsLimit,
                    amount: 0.00, // Free with package
                    paymentId: `PACKAGE_${packageId}_${Date.now()}`,
                    status: 'COMPLETED',
                    createdAt: now,
                }
            });

            // Create transaction record
            await tx.complimentTransaction.create({
                data: {
                    userId,
                    type: 'PACKAGE_CREDIT', // or 'SUBSCRIPTION_GRANT' depending on your ComplimentTransactionType enum
                    quantity: complimentsLimit,
                    complimentBalanceAfter: newTotalCompliments,
                    purchaseId: complimentPurchase.id,
                    createdAt: now,
                }
            });

            // Upsert the balance
            await tx.userComplimentBalance.upsert({
                where: { userId },
                create: {
                    userId,
                    totalCompliments: newTotalCompliments,
                    freeCompliments: newFreeCompliments,
                    purchasedCompliments: 0,
                    weeklyLimit: complimentsLimit,
                    totalComplimentsSent: 0,
                    lastResetAt: now,
                    nextResetAt: nextWeek,
                },
                update: {
                    totalCompliments: newTotalCompliments,
                    freeCompliments: newFreeCompliments,
                    weeklyLimit: complimentsLimit,
                    lastResetAt: now,
                    nextResetAt: nextWeek,
                }
            });

            featuresInitialized++;
            console.log(`💌 Compliments initialized: ${complimentsLimit}/week (Total: ${newTotalCompliments})`);
        }

        // 6. Initialize Boost Balance
        if (boostsLimit > 0) {
            // Get default boost option (or create a package-specific one)
            console.log("in boost feature function")
            const boostOption = await tx.boostOption.findFirst({
                where: {
                    boost: {
                        name: BoostType.BOOST,
                    },
                    is_active: true,
                },
                orderBy: {
                    created_at: "asc",
                },
            });

            console.log("boostOption : ", boostOption)
            if (!boostOption) {
                throw new Error("Default boost type not found");
            }

            // Get existing boost balance
            const existingBoost = await tx.userBoost.findFirst({
                where: {
                    user_id: userId,
                    boostId: boostOption.boost_id, // Boost table ID
                    is_active: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            console.log("existing boost : ", existingBoost)

            const currentTotalBoosts = existingBoost?.total_boosts || 0;
            const currentRemainingBoosts = existingBoost?.remaining_boosts || 0;
            const newTotalBoosts = currentTotalBoosts + boostsLimit;
            const newRemainingBoosts = currentRemainingBoosts + boostsLimit;

            // Create a system purchase record for tracking
            const boostPurchase = await tx.boostPurchase.create({
                data: {
                    userId,
                    boostOptionId: boostOption.id,
                    quantity: boostsLimit,
                    amount: 0.00, // Free with package
                    paymentId: `PACKAGE_${packageId}_${Date.now()}`,
                    status: 'COMPLETED',
                    createdAt: now,
                }
            });

            console.log("boost purchase : ", boostPurchase)

            // Create transaction record
            await tx.boostTransaction.create({
                data: {
                    userId,
                    type: 'ADMIN_ADD', // or 'PACKAGE_ACTIVATION' if you add it to the enum
                    quantity: boostsLimit,
                    boostBalanceAfter: newTotalBoosts,
                    purchaseId: boostPurchase.id,
                    createdAt: now,
                }
            });

            // Upsert the boost balance
            if (existingBoost) {
                // Update existing boost
                await tx.userBoost.update({
                    where: {
                        id: existingBoost.id
                    },
                    data: {
                        total_boosts: newTotalBoosts,
                        remaining_boosts: newRemainingBoosts,
                        weeklyLimit: boostsLimit,
                        last_reset_at: now,
                        next_reset_at: nextWeek,
                        is_active: true,
                    }
                });
            } else {
                // Create new boost
                await tx.userBoost.create({
                    data: {
                        user_id: userId,
                        boostId: boostOption.boost_id,        // ✅ Boost ID
                        boost_option_id: boostOption.id,
                        total_boosts: newTotalBoosts,
                        remaining_boosts: newRemainingBoosts,
                        weeklyLimit: boostsLimit,
                        last_reset_at: now,
                        next_reset_at: nextWeek,
                        start_at: now,
                        is_active: true,
                    }
                });
            }

            featuresInitialized++;
            console.log(`🚀 Boosts initialized: ${boostsLimit}/week (Total: ${newTotalBoosts})`);
        }

        // 7. Initialize Welcome Coins (one-time, if applicable)
        if (welcomeCoins > 0) {
            try {
                console.log(`🪙 Initializing welcome coins: ${welcomeCoins}`);

                // Get or create user's wallet
                let wallet = await tx.wallet.findUnique({
                    where: { userId }
                });

                const balanceBefore = wallet?.balance || 0;
                const balanceAfter = balanceBefore + welcomeCoins;

                if (!wallet) {
                    // Create wallet if it doesn't exist
                    wallet = await tx.wallet.create({
                        data: {
                            userId,
                            balance: welcomeCoins,
                        }
                    });
                    console.log(`✅ New wallet created for user: ${userId}`);
                } else {
                    // Update existing wallet
                    wallet = await tx.wallet.update({
                        where: { userId },
                        data: {
                            balance: {
                                increment: welcomeCoins
                            }
                        }
                    });
                    console.log(`✅ Wallet updated for user: ${userId}`);
                }

                // Create wallet transaction record
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: welcomeCoins,
                        type: 'DEPOSIT', // or 'PACKAGE_BONUS' depending on your TransactionType enum
                        status: 'SUCCESS',
                        source: 'PACKAGE_ACTIVATION', // or 'WELCOME_BONUS'
                        referenceId: `PACKAGE_${packageId}_${Date.now()}`,
                        description: `Welcome coins from package activation`,
                        balanceBefore,
                        balanceAfter,
                    }
                });

                console.log(`🪙 Welcome coins added: ${welcomeCoins} (Total wallet balance: ${balanceAfter})`);
            } catch (walletError) {
                console.error("❌ Error initializing welcome coins:", walletError);
                throw walletError; // You can decide whether to throw or continue
            }
        }

        // 6.5 Initialize Date Plan Balance
        if (datePlan > 0) {
            const existingBalance = await tx.datePlanUserStats.findUnique({
                where: { userId }
            });

            const currentBalance = existingBalance?.balance || 0;
            const newBalance = currentBalance + datePlan;

            // Create a system purchase record for tracking
            const datePlanPurchase = await tx.datePlanPurchase.create({
                data: {
                    userId,
                    quantity: datePlan,
                    amount: 0.00, // Free with package
                    paymentId: `PACKAGE_${packageId}_${Date.now()}`,
                    status: 'COMPLETED',
                    createdAt: now,
                }
            });

            // Create transaction record
            await tx.datePlanTransaction.create({
                data: {
                    userId,
                    type: 'PACKAGE_CREDIT',
                    quantity: datePlan,
                    balanceAfter: newBalance,
                    purchaseId: datePlanPurchase.id,
                    createdAt: now,
                }
            });

            // Upsert the balance
            await tx.datePlanUserStats.upsert({
                where: { userId },
                create: {
                    userId,
                    balance: newBalance,
                },
                update: {
                    balance: newBalance,
                }
            });

            featuresInitialized++;
            console.log(`📅 Date Plans initialized: ${datePlan} (Total: ${newBalance})`);
        }

        return featuresInitialized;
    } catch (error) {
        console.error("Error in initializePlanUsage:", error);
        throw error; // Re-throw to rollback transaction
    }
}

// Helper functions
function determinePackageTier(packageFeatures: any[]): string {
    // Based on feature limits, determine the tier
    const rosesLimit = getFeatureLimit(packageFeatures, 'ROSES');

    if (rosesLimit >= 30) return 'VIP_ELITE';
    if (rosesLimit >= 15) return 'VIP';
    if (rosesLimit >= 5) return 'PREMIUM';
    return 'FREE';
}

function getFeatureLimit(packageFeatures: any[], featureCode: string): number {
    const feature = packageFeatures.find(
        pf => pf.feature?.code === featureCode && pf.enabled
    );

    if (!feature) return 0;

    // If unlimited, return a very large number or handle differently
    if (feature.unlimited) return 999999;

    return feature.limit || 0;
}

function calculateEndDate(billingCycle: string, startDate: Date): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
        case 'MONTHLY':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case 'QUARTERLY':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
        case 'YEARLY':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        default:
            endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate;
}

async function expirePreviousPackage(userId: string, tx: any) {
    await tx.userPackage.updateMany({
        where: {
            user_id: userId,
            status: 'ACTIVE',
        },
        data: {
            status: 'EXPIRED',
            endDate: new Date(),
        },
    });

    // Also expire the subscription record
    await tx.userSubscription.updateMany({
        where: {
            userId,
            status: 'ACTIVE',
        },
        data: {
            status: 'EXPIRED',
        },
    });
}