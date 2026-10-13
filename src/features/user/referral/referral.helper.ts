import {
  Prisma,
  ReferralStatus,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

type ReferralTx = Prisma.TransactionClient;

export const applyReferralReward = async (
  tx: ReferralTx,
  userId: string,
  referralCode: string,
) => {
  // ==========================================
  // 1. VALIDATE CODE
  // ==========================================

  if (typeof referralCode !== "string" || !referralCode.trim()) {
    throw new Error("Referral code is required.");
  }

  const normalizedCode = referralCode.trim().toUpperCase();

  // ==========================================
  // 2. FIND REFERRED USER
  // ==========================================

  const currentUser = await tx.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      referralCode: true,
      deleted_at: true,
      account_status: true,
    },
  });

  if (
    !currentUser ||
    currentUser.deleted_at ||
    currentUser.account_status !== "ACTIVE"
  ) {
    throw new Error("User is not active.");
  }

  // ==========================================
  // 3. CHECK EXISTING REFERRAL
  // ==========================================

  const existingReferral = await tx.userReferral.findUnique({
    where: {
      referredUserId: userId,
    },
  });

  if (existingReferral) {
    throw new Error("Referral code has already been applied.");
  }

  // ==========================================
  // 4. FIND REFERRER
  // ==========================================

  const referrer = await tx.user.findUnique({
    where: {
      referralCode: normalizedCode,
    },
    select: {
      id: true,
      deleted_at: true,
      account_status: true,
    },
  });

  if (!referrer) {
    throw new Error("Invalid referral code.");
  }

  if (referrer.deleted_at || referrer.account_status !== "ACTIVE") {
    throw new Error("Referral code is inactive.");
  }

  // ==========================================
  // 5. PREVENT SELF REFERRAL
  // ==========================================

  if (referrer.id === userId) {
    throw new Error("You cannot use your own referral code.");
  }

  // ==========================================
  // 6. PREVENT REVERSE REFERRAL
  // ==========================================

  const reverseReferral = await tx.userReferral.findFirst({
    where: {
      referrerId: userId,
      referredUserId: referrer.id,
    },
  });

  if (reverseReferral) {
    throw new Error(
      "You cannot use the referral code of someone you referred.",
    );
  }

  // ==========================================
  // 7. GET REWARD CONFIGURATION
  // ==========================================

  const rewardConfig = await tx.rewardConfig.findFirst();

  if (!rewardConfig) {
    throw new Error("Reward configuration not found.");
  }

  const signupReward = new Prisma.Decimal(rewardConfig.signupReward);

  const waitlistReward = new Prisma.Decimal(rewardConfig.waitlistReward);

  if (signupReward.lessThan(0) || waitlistReward.lessThan(0)) {
    throw new Error("Invalid reward configuration.");
  }

  // ==========================================
  // 8. ENSURE BOTH WALLETS EXIST
  // ==========================================

  // Atomic upsert prevents missing-wallet errors.
  // Wallet.userId must be unique.

  await tx.wallet.upsert({
    where: {
      userId: referrer.id,
    },
    update: {},
    create: {
      userId: referrer.id,
      balance: 0,
    },
  });

  await tx.wallet.upsert({
    where: {
      userId,
    },
    update: {},
    create: {
      userId,
      balance: 0,
    },
  });

  // ==========================================
  // 9. LOCK BOTH WALLET ROWS
  // ==========================================

  const walletUserIds = [referrer.id, userId].sort();

  await tx.$queryRaw`
  SELECT "id"
  FROM "Wallet"
  WHERE "userId" IN (
    ${Prisma.join(walletUserIds.map((id) => Prisma.sql`${id}::uuid`))}
  )
  ORDER BY "userId"
  FOR UPDATE
`;

  // IMPORTANT:
  // This query assumes @@map("wallets") and
  // the database column "userId".
  // Adjust the table/column names to your schema.

  // ==========================================
  // 10. FETCH LOCKED WALLETS
  // ==========================================

  const referrerWallet = await tx.wallet.findUniqueOrThrow({
    where: {
      userId: referrer.id,
    },
  });

  const referredWallet = await tx.wallet.findUniqueOrThrow({
    where: {
      userId,
    },
  });

  const referrerBefore = new Prisma.Decimal(referrerWallet.balance);

  const referredBefore = new Prisma.Decimal(referredWallet.balance);

  const referrerAfter = referrerBefore.plus(signupReward);

  const referredAfter = referredBefore.plus(waitlistReward);

  // ==========================================
  // 11. CREATE REFERRAL RECORD
  // ==========================================

  const referral = await tx.userReferral.create({
    data: {
      referrerId: referrer.id,
      referredUserId: userId,
      status: "PENDING",
    },
  });

  // ==========================================
  // 12. CREDIT REFERRER (USER B)
  // ==========================================

  await tx.wallet.update({
    where: {
      id: referrerWallet.id,
    },
    data: {
      balance: {
        increment: signupReward,
      },
    },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: referrerWallet.id,
      amount: signupReward,
      balanceBefore: referrerBefore,
      balanceAfter: referrerAfter,
      type: TransactionType.REWARD,
      status: TransactionStatus.SUCCESS,
      source: TransactionSource.REFERRAL_SIGNUP,
      referenceId: referral.id,
      description: "Reward for referring a new user",
    },
  });

  // ==========================================
  // 13. CREDIT REFERRED USER (USER A)
  // ==========================================

  await tx.wallet.update({
    where: {
      id: referredWallet.id,
    },
    data: {
      balance: {
        increment: waitlistReward,
      },
    },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: referredWallet.id,
      amount: waitlistReward,
      balanceBefore: referredBefore,
      balanceAfter: referredAfter,
      type: TransactionType.REWARD,
      status: TransactionStatus.SUCCESS,
      source: TransactionSource.REFERRAL_SIGNUP,
      referenceId: referral.id,
      description: "Reward for applying a referral code",
    },
  });

  // ==========================================
  // 14. UPDATE REFERRAL STATUS
  // ==========================================

  await tx.userReferral.update({
    where: {
      id: referral.id,
    },
    data: {
      signupReward,
      rewardedAt: new Date(),
      status: ReferralStatus.SIGNUP_REWARDED,
    },
  });

  // ==========================================
  // 15. UPDATE REFERRER STATISTICS
  // ==========================================

  await tx.userReferralStats.upsert({
    where: {
      userId: referrer.id,
    },
    update: {
      totalInvites: {
        increment: 1,
      },
      joinedUsers: {
        increment: 1,
      },
      rewardedUsers: {
        increment: 1,
      },
      totalCoinsEarned: {
        increment: Number(signupReward),
      },
    },
    create: {
      userId: referrer.id,
      totalInvites: 1,
      joinedUsers: 1,
      rewardedUsers: 1,
      totalCoinsEarned: Number(signupReward),
      pendingRewards: 0,
    },
  });

  // ==========================================
  // 16. RESPONSE
  // ==========================================

  return {
    success: true,
    message: "Referral applied successfully. Both users received rewards.",
    data: {
      referralId: referral.id,
      referrer: {
        userId: referrer.id,
        reward: signupReward.toNumber(),
        walletBalance: referrerAfter.toNumber(),
      },
      referredUser: {
        userId,
        reward: waitlistReward.toNumber(),
        walletBalance: referredAfter.toNumber(),
      },
    },
  };
};

export const rewardReferrerOnPackagePurchase = async (
  tx: ReferralTx,
  userId: string,
) => {
  // ==========================================
  // 1. FIND USER A'S REFERRAL
  // ==========================================

  const referral = await tx.userReferral.findUnique({
    where: {
      referredUserId: userId,
    },
  });

  console.log("refereal : ", referral);
  // User A did not use a referral code
  if (!referral) {
    return null;
  }

  // ==========================================
  // 2. CHECK ALREADY REWARDED
  // ==========================================

  if (referral.purchaseAt !== null) {
    return null;
  }

  // ==========================================
  // 3. GET REWARD CONFIG
  // ==========================================

  const rewardConfig = await tx.rewardConfig.findFirst();

  if (!rewardConfig) {
    throw new Error("REWARD_CONFIG_NOT_FOUND");
  }

  const packageReward = new Prisma.Decimal(rewardConfig.packageReward);

  if (packageReward.lessThan(0)) {
    throw new Error("INVALID_PACKAGE_REWARD");
  }

  // ==========================================
  // 4. LOCK REFERRER WALLET
  // ==========================================

  // Your Prisma Wallet model has no @@map,
  // so the PostgreSQL table name is "Wallet".

  await tx.$queryRaw`
    SELECT "id"
    FROM "Wallet"
    WHERE "userId" = ${referral.referrerId}::uuid
    FOR UPDATE
  `;

  // ==========================================
  // 5. GET USER B'S WALLET
  // ==========================================

  const wallet = await tx.wallet.findUnique({
    where: {
      userId: referral.referrerId,
    },
  });

  if (!wallet) {
    throw new Error("REFERRER_WALLET_NOT_FOUND");
  }

  // ==========================================
  // 6. ATOMICALLY CLAIM PACKAGE REWARD
  // ==========================================

  const claim = await tx.userReferral.updateMany({
    where: {
      id: referral.id,
      purchaseAt: null,
    },
    data: {
      purchaseReward: packageReward,
      purchaseAt: new Date(),
    },
  });

  // Already claimed by another transaction
  if (claim.count !== 1) {
    return null;
  }

  // ==========================================
  // 7. CALCULATE WALLET BALANCE
  // ==========================================

  const balanceBefore = new Prisma.Decimal(wallet.balance);

  const balanceAfter = balanceBefore.plus(packageReward);

  // ==========================================
  // 8. CREDIT USER B'S WALLET
  // ==========================================

  const updatedWallet = await tx.wallet.update({
    where: {
      id: wallet.id,
    },
    data: {
      balance: {
        increment: packageReward,
      },
    },
  });

  // ==========================================
  // 9. CREATE WALLET TRANSACTION
  // ==========================================

  // This uses your existing REFERRAL_SIGNUP
  // source to avoid requiring a new enum.
  // If REFERRAL_PACKAGE already exists,
  // use it instead.

  const walletTransaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: packageReward,
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      type: TransactionType.REWARD,
      status: TransactionStatus.SUCCESS,
      source: TransactionSource.REFERRAL_PURCHASE,
      referenceId: referral.id,
      description: "Referral reward for package purchase",
    },
  });

  // ==========================================
  // 10. UPDATE REFERRER STATS
  // ==========================================

  await tx.userReferralStats.upsert({
    where: {
      userId: referral.referrerId,
    },
    update: {
      totalCoinsEarned: {
        increment: packageReward.toNumber(),
      },
    },
    create: {
      userId: referral.referrerId,

      totalInvites: 0,
      joinedUsers: 0,
      rewardedUsers: 0,
      pendingRewards: 0,

      totalCoinsEarned: packageReward.toNumber(),
    },
  });

  // ==========================================
  // 11. RETURN
  // ==========================================

  return {
    referralId: referral.id,
    referrerId: referral.referrerId,

    rewardAmount: packageReward.toNumber(),

    walletTransactionId: walletTransaction.id,

    balanceBefore: balanceBefore.toNumber(),

    balanceAfter: updatedWallet.balance.toNumber(),
  };
};
