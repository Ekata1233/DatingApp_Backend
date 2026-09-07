import {
  TransactionSource,
  TransactionType,
} from "@prisma/client";

import { walletRepository } from "./wallet.repository";

import {
  GetWalletQuery,
  WalletTransactionFilter,
} from "./wallet.types";

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

// ==========================================
// GET TRANSACTION DIRECTION
// ==========================================

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