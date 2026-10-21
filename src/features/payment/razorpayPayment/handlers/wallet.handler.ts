import { Payment, Prisma } from "@prisma/client";

export async function fulfillWalletTopup(
  tx: Prisma.TransactionClient,
  payment: Payment,
) {
  const existing = await tx.walletTransaction.findFirst({
    where: {
      referenceId: payment.id,
      source: "WALLET_TOPUP",
      status: "SUCCESS",
    },
  });

  if (existing) return existing;

  const wallet = await tx.wallet.upsert({
    where: { userId: payment.userId },
    create: {
      userId: payment.userId,
      balance: 0,
    },
    update: {},
  });

  const updatedWallet = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: {
        increment: payment.amount,
      },
    },
  });

  return tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: payment.amount,
      type: "DEPOSIT",
      status: "SUCCESS",
      source: "WALLET_TOPUP",
      referenceId: payment.id,
      description: "Razorpay wallet top-up",
      balanceBefore:
        updatedWallet.balance.minus(payment.amount),
      balanceAfter: updatedWallet.balance,
    },
  });
}