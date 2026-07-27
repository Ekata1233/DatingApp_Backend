export async function initializePlanUsage(
    userId: string,
    packageId: string,
    tx: any
) {
    // 1. Get package features with their limits
    const packageFeatures = await tx.packageFeature.findMany({
        where: {
            packageId: packageId,
            enabled: true
        },
        include: {
            feature: true
        }
    });

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
                type: 'PACKAGE_ACTIVATION', // or 'SUBSCRIPTION_GRANT' depending on your RoseTransactionType enum
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
                type: 'PACKAGE_ACTIVATION', // or 'SUBSCRIPTION_GRANT' depending on your ComplimentTransactionType enum
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
        await tx.userBoost.upsert({
            where: { userId },
            create: {
                userId,
                total_boosts: total_boosts + boostsLimit,
                remaining_boosts: boostsLimit,
                weeklyLimit: boostsLimit,
                lastResetAt: now,
                subscriptionTier: tier,
            },
            update: {
                total_boosts: total_boosts + boostsLimit,
                remaining_boosts: boostsLimit,
                weeklyLimit: boostsLimit,
                lastResetAt: now,
                subscriptionTier: tier,
            }
        });
        featuresInitialized++;
        console.log(`🚀 Boosts initialized: ${boostsLimit}/week`);
    }

    // 7. Initialize Welcome Coins (one-time, if applicable)
    if (welcomeCoins > 0) {
        // Assuming you have a coins/wallet system
        await tx.userWallet.upsert({
            where: { userId },
            create: {
                userId,
                balance: welcomeCoins,
            },
            update: {
                balance: { increment: welcomeCoins }
            }
        });
        console.log(`🪙 Welcome coins added: ${welcomeCoins}`);
    }

    // 8. Create subscription record for tracking
    await tx.userSubscription.create({
        data: {
            userId,
            packageId,
            tier,
            status: 'ACTIVE',
            activatedAt: now,
            lastResetAt: now,
            expiresAt: calculateEndDate(
                packageFeatures[0]?.package?.billingCycle || 'MONTHLY',
                now
            ),
        }
    });

    return featuresInitialized;
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