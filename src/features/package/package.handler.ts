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

        // Execute all feature initializations in parallel
        const results = await Promise.all([
            // 4. Initialize Rose Balance
            initializeRoses(userId, packageId, rosesLimit, now, nextWeek, tx),
            // 5. Initialize Compliment Balance
            initializeCompliments(userId, packageId, complimentsLimit, now, nextWeek, tx),
            // 6. Initialize Boost Balance
            initializeBoosts(userId, packageId, boostsLimit, now, nextWeek, tx),
            // 7. Initialize Welcome Coins
            initializeWelcomeCoins(userId, packageId, welcomeCoins, now, tx),
            // 8. Initialize Date Plan Balance
            initializeDatePlans(userId, packageId, datePlan, now, tx),
        ]);

        featuresInitialized = results.filter(Boolean).length;

        return featuresInitialized;
    } catch (error) {
        console.error("Error in initializePlanUsage:", error);
        throw error; // Re-throw to rollback transaction
    }
}

// Improved version for Roses that handles the dependency
async function initializeRoses(
    userId: string,
    packageId: string,
    rosesLimit: number,
    now: Date,
    nextWeek: Date,
    tx: any
): Promise<boolean> {
    if (rosesLimit <= 0) return false;

    try {
        const existingBalance = await tx.userRoseBalance.findUnique({
            where: { userId }
        });

        const currentTotalRoses = existingBalance?.totalRoses || 0;
        const currentFreeRoses = existingBalance?.freeRoses || 0;
        const newTotalRoses = currentTotalRoses + rosesLimit;
        const newFreeRoses = currentFreeRoses + rosesLimit;

        // Create purchase first (needed for transaction)
        const rosePurchase = await tx.rosePurchase.create({
            data: {
                userId,
                quantity: rosesLimit,
                amount: 0.00,
                paymentId: `PACKAGE_${packageId}_${Date.now()}`,
                status: 'COMPLETED',
                createdAt: now,
            }
        });

        // Run transaction and balance update in parallel
        await Promise.all([
            tx.roseTransaction.create({
                data: {
                    userId,
                    type: 'PACKAGE_CREDIT',
                    quantity: rosesLimit,
                    roseBalanceAfter: newTotalRoses,
                    purchaseId: rosePurchase.id,
                    createdAt: now,
                }
            }),
            tx.userRoseBalance.upsert({
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
            })
        ]);

        console.log(`🌹 Roses initialized: ${rosesLimit}/week (Total: ${newTotalRoses})`);
        return true;
    } catch (error) {
        console.error("Error initializing roses:", error);
        throw error;
    }
}

// Helper function to initialize Compliments
async function initializeCompliments(
    userId: string,
    packageId: string,
    complimentsLimit: number,
    now: Date,
    nextWeek: Date,
    tx: any
): Promise<boolean> {
    if (complimentsLimit <= 0) return false;

    try {
        const existingBalance = await tx.userComplimentBalance.findUnique({
            where: { userId }
        });

        const currentTotalCompliments = existingBalance?.totalCompliments || 0;
        const currentFreeCompliments = existingBalance?.freeCompliments || 0;
        const newTotalCompliments = currentTotalCompliments + complimentsLimit;
        const newFreeCompliments = currentFreeCompliments + complimentsLimit;

        // Create purchase first
        const complimentPurchase = await tx.complimentPurchase.create({
            data: {
                userId,
                quantity: complimentsLimit,
                amount: 0.00,
                paymentId: `PACKAGE_${packageId}_${Date.now()}`,
                status: 'COMPLETED',
                createdAt: now,
            }
        });

        // Run transaction and balance update in parallel
        await Promise.all([
            tx.complimentTransaction.create({
                data: {
                    userId,
                    type: 'PACKAGE_CREDIT',
                    quantity: complimentsLimit,
                    complimentBalanceAfter: newTotalCompliments,
                    purchaseId: complimentPurchase.id,
                    createdAt: now,
                }
            }),
            tx.userComplimentBalance.upsert({
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
            })
        ]);

        console.log(`💌 Compliments initialized: ${complimentsLimit}/week (Total: ${newTotalCompliments})`);
        return true;
    } catch (error) {
        console.error("Error initializing compliments:", error);
        throw error;
    }
}

// Helper function to initialize Boosts
async function initializeBoosts(
    userId: string,
    packageId: string,
    boostsLimit: number,
    now: Date,
    nextWeek: Date,
    tx: any
): Promise<boolean> {
    if (boostsLimit <= 0) return false;

    try {
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
                boostId: boostOption.boost_id,
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

        // Create purchase first
        const boostPurchase = await tx.boostPurchase.create({
            data: {
                userId,
                boostOptionId: boostOption.id,
                quantity: boostsLimit,
                amount: 0.00,
                paymentId: `PACKAGE_${packageId}_${Date.now()}`,
                status: 'COMPLETED',
                createdAt: now,
            }
        });

        console.log("boost purchase : ", boostPurchase)

        // Run transaction and balance update in parallel
        const promises = [
            tx.boostTransaction.create({
                data: {
                    userId,
                    type: 'ADMIN_ADD',
                    quantity: boostsLimit,
                    boostBalanceAfter: newTotalBoosts,
                    purchaseId: boostPurchase.id,
                    createdAt: now,
                }
            })
        ];

        // Add boost balance update/create
        if (existingBoost) {
            promises.push(
                tx.userBoost.update({
                    where: { id: existingBoost.id },
                    data: {
                        total_boosts: newTotalBoosts,
                        remaining_boosts: newRemainingBoosts,
                        weeklyLimit: boostsLimit,
                        last_reset_at: now,
                        next_reset_at: nextWeek,
                        is_active: true,
                    }
                })
            );
        } else {
            promises.push(
                tx.userBoost.create({
                    data: {
                        user_id: userId,
                        boostId: boostOption.boost_id,
                        boost_option_id: boostOption.id,
                        total_boosts: newTotalBoosts,
                        remaining_boosts: newRemainingBoosts,
                        weeklyLimit: boostsLimit,
                        last_reset_at: now,
                        next_reset_at: nextWeek,
                        start_at: now,
                        is_active: true,
                    }
                })
            );
        }

        await Promise.all(promises);

        console.log(`🚀 Boosts initialized: ${boostsLimit}/week (Total: ${newTotalBoosts})`);
        return true;
    } catch (error) {
        console.error("Error initializing boosts:", error);
        throw error;
    }
}

// Helper function to initialize Welcome Coins
async function initializeWelcomeCoins(
    userId: string,
    packageId: string,
    welcomeCoins: number,
    now: Date,
    tx: any
): Promise<boolean> {
    if (welcomeCoins <= 0) return false;

    try {
        console.log(`🪙 Initializing welcome coins: ${welcomeCoins}`);

        // Get or create user's wallet
        let wallet = await tx.wallet.findUnique({
            where: { userId }
        });

        const balanceBefore = wallet?.balance || 0;
        const balanceAfter = balanceBefore + welcomeCoins;

        if (!wallet) {
            // Create wallet and transaction in parallel
            wallet = await tx.wallet.create({
                data: {
                    userId,
                    balance: welcomeCoins,
                }
            });
            console.log(`✅ New wallet created for user: ${userId}`);
        } else {
            // Update wallet
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

        // Create wallet transaction
        await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: welcomeCoins,
                type: 'DEPOSIT',
                status: 'SUCCESS',
                source: 'PACKAGE_ACTIVATION',
                referenceId: `PACKAGE_${packageId}_${Date.now()}`,
                description: `Welcome coins from package activation`,
                balanceBefore,
                balanceAfter,
            }
        });

        console.log(`🪙 Welcome coins added: ${welcomeCoins} (Total wallet balance: ${balanceAfter})`);
        return true;
    } catch (error) {
        console.error("❌ Error initializing welcome coins:", error);
        throw error;
    }
}

// Helper function to initialize Date Plans
async function initializeDatePlans(
    userId: string,
    packageId: string,
    datePlan: number,
    now: Date,
    tx: any
): Promise<boolean> {
    if (datePlan <= 0) return false;

    try {
        const existingBalance = await tx.datePlanUserStats.findUnique({
            where: { userId }
        });

        const currentBalance = existingBalance?.balance || 0;
        const newBalance = currentBalance + datePlan;

        // Create purchase first
        const datePlanPurchase = await tx.datePlanPurchase.create({
            data: {
                userId,
                quantity: datePlan,
                amount: 0.00,
                paymentId: `PACKAGE_${packageId}_${Date.now()}`,
                status: 'COMPLETED',
                createdAt: now,
            }
        });

        // Run transaction and balance update in parallel
        await Promise.all([
            tx.datePlanTransaction.create({
                data: {
                    userId,
                    type: 'PACKAGE_CREDIT',
                    quantity: datePlan,
                    balanceAfter: newBalance,
                    purchaseId: datePlanPurchase.id,
                    createdAt: now,
                }
            }),
            tx.datePlanUserStats.upsert({
                where: { userId },
                create: {
                    userId,
                    balance: newBalance,
                },
                update: {
                    balance: newBalance,
                }
            })
        ]);

        console.log(`📅 Date Plans initialized: ${datePlan} (Total: ${newBalance})`);
        return true;
    } catch (error) {
        console.error("Error initializing date plans:", error);
        throw error;
    }
}



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
