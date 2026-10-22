import {
  Prisma,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

import { walletRepository } from "./wallet.repository";

import {
  AddMoneyData,
  GetWalletQuery,
  WalletTransactionFilter,
} from "./wallet.types";
import { prisma } from "../../prisma/prismaClient";
import { consumeWalletGooglePurchase, verifyWalletGooglePurchase } from "./walletGooglePlay.provider";
import { createHash } from "node:crypto";


export const getMyWalletService = async (
  userId: string,
  query: GetWalletQuery,
) => {
  // ==========================================
  // PAGINATION
  // ==========================================

  const page = Math.max(
    Number(query.page) || 1,
    1,
  );

  const limit = Math.min(
    Math.max(
      Number(query.limit) || 20,
      1,
    ),
    50,
  );

  const skip = (page - 1) * limit;

  // ==========================================
  // FILTER
  // ==========================================

  const filter: WalletTransactionFilter =
    ["ALL", "IN", "OUT"].includes(
      String(query.filter).toUpperCase(),
    )
      ? (String(
          query.filter,
        ).toUpperCase() as WalletTransactionFilter)
      : "ALL";

  // ==========================================
  // TRANSACTION SOURCE FILTER
  // ==========================================

  const source: TransactionSource | undefined =
    query.source &&
    Object.values(TransactionSource).includes(
      query.source,
    )
      ? query.source
      : undefined;

  // ==========================================
  // WALLET
  // ==========================================

  const wallet =
    await walletRepository.getWalletByUserId(
      userId,
    );

  /*
   * User may not have wallet record yet.
   * Return zero balance instead of throwing error.
   */

  if (!wallet) {
    const datePlan =
      await walletRepository.getDatePlanBalance(
        userId,
      );

    return {
      wallet: {
        balance: 0,
        currency: "INR",
        formattedBalance: "₹0",
      },

      datePlans: {
        balance:
          datePlan?.balance ?? 0,

        label: `${
          datePlan?.balance ?? 0
        } left`,
      },

      filter,

      source: source ?? null,

      transactions: [],

      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  // ==========================================
  // FETCH TRANSACTIONS + DATE PLAN
  // ==========================================

  const [
    transactionResult,
    datePlanStats,
  ] = await Promise.all([
    walletRepository.getTransactions({
      walletId: wallet.id,
      filter,
      source,
      skip,
      take: limit,
    }),

    walletRepository.getDatePlanBalance(
      userId,
    ),
  ]);

  // ==========================================
  // FORMAT TRANSACTIONS
  // ==========================================

  const transactions =
    transactionResult.transactions.map(
      (transaction) => {
        const direction =
          getTransactionDirection(
            transaction.type,
          );

        const amount = Number(
          transaction.amount,
        );

        return {
          id: transaction.id,

          type: transaction.type,

          source: transaction.source,

          status: transaction.status,

          direction,

          title:
            getTransactionTitle(
              transaction.type,
              transaction.source,
              transaction.description,
            ),

          description:
            transaction.description,

          amount,

          formattedAmount:
            formatTransactionAmount(
              amount,
              direction,
            ),

          balanceBefore: Number(
            transaction.balanceBefore,
          ),

          balanceAfter: Number(
            transaction.balanceAfter,
          ),

          referenceId:
            transaction.referenceId,

          createdAt:
            transaction.createdAt,
        };
      },
    );

  const walletBalance = Number(
    wallet.balance,
  );

  const datePlanBalance =
    datePlanStats?.balance ?? 0;

  const total =
    transactionResult.total;

  const totalPages = Math.ceil(
    total / limit,
  );

  return {
    wallet: {
      balance: walletBalance,

      currency: "INR",

      formattedBalance:
        formatCurrency(walletBalance),
    },

    datePlans: {
      balance: datePlanBalance,

      totalDatePlan:
        datePlanStats?.totalDatePlan ??
        0,

      purchasedDatePlan:
        datePlanStats
          ?.purchasedDataPlan ?? 0,

      label: `${datePlanBalance} left`,
    },

    filter,

    source: source ?? null,

    transactions,

    pagination: {
      page,
      limit,
      total,
      totalPages,

      hasNextPage:
        page < totalPages,

      hasPreviousPage:
        page > 1,
    },
  };
};




const getTransactionDirection = (
  type: TransactionType,
): "IN" | "OUT" => {
  switch (type) {
    case TransactionType.DEPOSIT:
    case TransactionType.REFUND:
    case TransactionType.REWARD:
    case TransactionType.PACKAGE_BONUS:
      return "IN";

    case TransactionType.WITHDRAW:
    case TransactionType.PURCHASE:
      return "OUT";

    default:
      return "OUT";
  }
};

// ==========================================
// TRANSACTION TITLE
// ==========================================

const getTransactionTitle = (
  type: TransactionType,
  source: TransactionSource | null,
  description: string | null,
) => {
  /*
   * If you already saved proper description
   * while creating transaction, use it.
   */

  if (description) {
    return description;
  }

  switch (source) {
    case TransactionSource.WALLET_TOPUP:
      return "Wallet topped up";

    case TransactionSource.PACKAGE_ACTIVATION:
      return "Package activated";

    case TransactionSource.PREMIUM_PLAN:
      return "Premium plan purchased";

    case TransactionSource.BOOST_PURCHASE:
      return "Boost purchased";

    case TransactionSource.SUPER_LIKE:
      return "Super Like purchased";

    case TransactionSource.DATE_PLAN_BOOKING:
      return "Date Plans purchased";

    case TransactionSource.DATE_PLAN_REFUND:
      return "Date Plan refund";

    case TransactionSource.WITHDRAWAL:
      return "Wallet withdrawal";

    case TransactionSource.REFERRAL_SIGNUP:
      return "Referral reward";

    case TransactionSource.REFERRAL_PURCHASE:
      return "Referral purchase reward";

    case TransactionSource.WAITLIST_REFERRAL_SIGNUP:
      return "Waitlist referral reward";

    case TransactionSource.WAITLIST_REFERRAL_PAYMENT:
      return "Waitlist referral payment reward";

    case TransactionSource.GIFT_PURCHASE:
      return "Gift purchased";

    case TransactionSource.GIFT_REDEEM:
      return "Gift received";

    case TransactionSource.ROSE_REDEEM:
      return "Rose redeemed";

    default:
      break;
  }

  switch (type) {
    case TransactionType.DEPOSIT:
      return "Money added";

    case TransactionType.WITHDRAW:
      return "Money withdrawn";

    case TransactionType.PURCHASE:
      return "Purchase";

    case TransactionType.REFUND:
      return "Refund";

    case TransactionType.REWARD:
      return "Reward received";

    case TransactionType.PACKAGE_BONUS:
      return "Package bonus";

    default:
      return "Wallet transaction";
  }
};

// ==========================================
// FORMAT MONEY
// ==========================================

const formatCurrency = (
  amount: number,
) => {
  return `₹${amount.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    },
  )}`;
};

// ==========================================
// FORMAT TRANSACTION MONEY
// ==========================================

const formatTransactionAmount = (
  amount: number,
  direction: "IN" | "OUT",
) => {
  const formatted =
    amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  return direction === "IN"
    ? `+₹${formatted}`
    : `-₹${formatted}`;
};

// ==========================================
// TYPES
// ==========================================



// ==========================================
// SERVER-CONTROLLED PRODUCT CATALOG
// ==========================================

const WALLET_PRODUCTS: Record<string, number> = {
  welvors_coins_500: 500,
  welvors_coins_1000: 1000,
  welvors_coins_2000: 2000,
};

// ==========================================
// ADD MONEY USING GOOGLE PLAY
// ==========================================

export const addMoneyToWalletService = async (
  data: AddMoneyData
) => {
  const {
    userId,
    amount,
    productId,
    orderId,
    purchaseToken,
  } = data;


  console.log("product id : ", productId)
  // ------------------------------------------
  // 1. VALIDATE INPUT
  // ------------------------------------------

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid wallet top-up amount");
  }

  // const allowedAmount = WALLET_PRODUCTS[productId];

  // if (
  //   allowedAmount === undefined ||
  //   allowedAmount !== amount
  // ) {
  //   throw new Error(
  //     "Invalid Google Play product or wallet amount"
  //   );
  // }

  // ------------------------------------------
  // 2. VALIDATE USER
  // ------------------------------------------

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // ------------------------------------------
  // 3. GENERATE PURCHASE TOKEN HASH
  // ------------------------------------------

  const purchaseTokenHash = createHash("sha256")
    .update(purchaseToken)
    .digest("hex");

  // ------------------------------------------
  // 4. VERIFY WITH GOOGLE PLAY
  // ------------------------------------------

  const verified = await verifyWalletGooglePurchase(
    productId,
    purchaseToken,
    orderId
  );

  if (
    verified.productId !== productId ||
    verified.orderId !== orderId
  ) {
    throw new Error(
      "Google Play purchase verification failed"
    );
  }

  // ------------------------------------------
  // 5. PREVENT DUPLICATE PURCHASE CREDIT
  // ------------------------------------------

  const existingPurchase =
    await prisma.walletGooglePlayPurchase.findFirst({
      where: {
        OR: [
          { purchaseTokenHash },
          { orderId },
        ],
      },
    });

  if (existingPurchase) {
    if (existingPurchase.userId !== userId) {
      throw new Error(
        "This purchase belongs to another user"
      );
    }

    if (existingPurchase.status === "SUCCESS") {
      throw new Error(
        "This Google Play purchase has already been credited"
      );
    }

    if (existingPurchase.status === "PROCESSING") {
      throw new Error(
        "This Google Play purchase is already processing"
      );
    }

    throw new Error(
      "This purchase requires reconciliation before retrying"
    );
  }

  // ------------------------------------------
  // 6. CREDIT WALLET ATOMICALLY
  // ------------------------------------------

  const result = await prisma.$transaction(
    async (tx) => {
      // Reserve the unique purchase token and order ID.
      // Concurrent duplicate requests cannot both insert.
      const purchase =
        await tx.walletGooglePlayPurchase.create({
          data: {
            userId,
            productId,
            orderId,
            purchaseTokenHash,
            amount: new Prisma.Decimal(amount),
            status: "PROCESSING",
          },
        });

      // Ensure wallet exists.
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: {
          userId,
          balance: new Prisma.Decimal(0),
        },
        update: {},
      });

      // Atomic balance increment.
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: new Prisma.Decimal(amount),
          },
        },
      });

      // Correct balance before this increment.
      const balanceBefore =
        updatedWallet.balance.minus(amount);

      // Wallet transaction history.
      const transaction =
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: new Prisma.Decimal(amount),
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.SUCCESS,
            source: TransactionSource.WALLET_TOPUP,
            description:
              `Google Play wallet top-up: ${productId}`,
            balanceBefore,
            balanceAfter: updatedWallet.balance,
          },
        });

      // Mark purchase successfully credited.
      await tx.walletGooglePlayPurchase.update({
        where: { id: purchase.id },
        data: {
          status: "SUCCESS",
          walletTransactionId: transaction.id,
        },
      });

      return {
        wallet: updatedWallet,
        transaction,
        orderId,
        productId,
      };
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    }
  );

  // ------------------------------------------
  // 7. CONSUME GOOGLE PLAY PURCHASE
  // ------------------------------------------
  // Credit is already committed.
  // Consumption failures must not cause
  // another wallet credit.

  let consumptionPending = false;

  try {
    await consumeWalletGooglePurchase(
      productId,
      purchaseToken
    );
  } catch (error) {
    consumptionPending = true;

    console.error(
      "GOOGLE PLAY CONSUMPTION FAILED:",
      error
    );

    // A production system needs a durable retry
    // mechanism for pending consumption.
  }

  // ------------------------------------------
  // 8. RETURN RESPONSE
  // ------------------------------------------

  return {
    walletId: result.wallet.id,

    addedAmount:
      result.transaction.amount.toNumber(),

    balanceBefore:
      result.transaction.balanceBefore.toNumber(),

    balanceAfter:
      result.transaction.balanceAfter.toNumber(),

    transactionId:
      result.transaction.id,

    transactionType:
      result.transaction.type,

    transactionStatus:
      result.transaction.status,

    source:
      result.transaction.source,

    paymentMethod: "GOOGLE_PLAY",

    productId: result.productId,

    orderId: result.orderId,

    consumptionPending,

    createdAt:
      result.transaction.createdAt,
  };
};
