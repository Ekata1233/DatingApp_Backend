import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { creditPackageBenefits } from "../package-purchase/package-benefits.helper";

export const renewWeeklyPackageBenefits = async () => {
  const now = new Date();
  const batchSize = 100;

  let cursor: string | undefined;

  let renewedCount = 0;
  let failedCount = 0;

  while (true) {
    // ==========================================
    // 1. FETCH USERS WITH DUE WEEKLY BENEFITS
    // ==========================================

    const dueUsers = await prisma.userRoseBalance.findMany({
      where: {
        nextResetAt: {
          lte: now,
        },
      },

      select: {
        id: true,
        userId: true,
      },

      orderBy: {
        id: "asc",
      },

      take: batchSize,

      ...(cursor
        ? {
            cursor: {
              id: cursor,
            },
            skip: 1,
          }
        : {}),
    });

    if (dueUsers.length === 0) {
      break;
    }

    // ==========================================
    // 2. PROCESS EACH USER
    // ==========================================

    for (const item of dueUsers) {
      try {
        const renewed = await prisma.$transaction(
          async (tx) => {
            const currentTime = new Date();

            // ==========================================
            // 3. CHECK ACTIVE PACKAGE
            // ==========================================

            const activePackage =
              await tx.userPackage.findFirst({
                where: {
                  user_id: item.userId,
                  status: "ACTIVE",

                  startDate: {
                    lte: currentTime,
                  },

                  OR: [
                    {
                      endDate: null,
                    },
                    {
                      endDate: {
                        gt: currentTime,
                      },
                    },
                  ],

                  user: {
                    account_status: "ACTIVE",
                  },
                },

                select: {
                  id: true,
                  packageId: true,
                },

                orderBy: {
                  startDate: "desc",
                },
              });

            if (!activePackage) {
              return false;
            }

            // ==========================================
            // 4. PREVENT DUPLICATE WEEKLY CREDIT
            // ==========================================

            const nextResetAt = new Date(
              currentTime.getTime() +
                7 * 24 * 60 * 60 * 1000,
            );

            const claimed =
              await tx.userRoseBalance.updateMany({
                where: {
                  userId: item.userId,

                  nextResetAt: {
                    lte: currentTime,
                  },
                },

                data: {
                  nextResetAt,
                },
              });

            if (claimed.count === 0) {
              return false;
            }

            // ==========================================
            // 5. CREDIT WEEKLY PACKAGE BENEFITS
            // ==========================================

            await creditPackageBenefits(
              tx,
              item.userId,
              activePackage.packageId,
              true,
            );

            return true;
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,

            maxWait: 5000,
            timeout: 15000,
          },
        );

        if (renewed) {
          renewedCount++;

          console.log(
            "Weekly package benefits credited:",
            item.userId,
          );
        }
      } catch (error) {
        failedCount++;

        console.error(
          "Weekly package renewal failed:",
          item.userId,
          error,
        );
      }
    }

    cursor = dueUsers[dueUsers.length - 1].id;

    if (dueUsers.length < batchSize) {
      break;
    }
  }

  return {
    renewedCount,
    failedCount,
  };
};