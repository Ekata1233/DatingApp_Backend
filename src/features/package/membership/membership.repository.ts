import {
  PackageStatus,
  PaymentPurpose,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

/**
 * Get user's currently active membership.
 */
export const findCurrentMembership = async (userId: string) => {
  const now = new Date();

  return prisma.userPackage.findFirst({
    where: {
      user_id: userId,

      status: PackageStatus.ACTIVE,

      startDate: {
        lte: now,
      },

      OR: [
        {
          endDate: null,
        },
        {
          endDate: {
            gt: now,
          },
        },
      ],
    },

    include: {
      package: {
        select: {
          id: true,
          name: true,
          slug: true,
          tagline: true,
          badgeLabel: true,
        },
      },

      currentPackage: {
        select: {
          id: true,
          name: true,
          slug: true,
          tagline: true,
        },
      },

      price: {
        select: {
          id: true,
          billingCycle: true,
          months: true,
          price: true,
          originalPrice: true,
          discountPercent: true,
        },
      },

      payment: {
        select: {
          id: true,
          amount: true,
          currency: true,
          payment_id: true,
          transactionId: true,
          status: true,
          gatewayResponse: true,
          paidAt: true,
          created_at: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Get complete package purchase history.
 */
export const findMembershipHistory = async (userId: string) => {
  return prisma.userPackage.findMany({
    where: {
      user_id: userId,
    },

    include: {
      package: {
        select: {
          id: true,
          name: true,
          slug: true,
          tagline: true,
          badgeLabel: true,
        },
      },

      currentPackage: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      price: {
        select: {
          id: true,
          billingCycle: true,
          months: true,
          price: true,
          originalPrice: true,
          discountPercent: true,
        },
      },

      payment: {
        select: {
          id: true,
          amount: true,
          currency: true,
          payment_id: true,
          transactionId: true,
          status: true,
          purpose: true,
          gatewayResponse: true,
          paidAt: true,
          created_at: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Calculate total successfully paid for memberships.
 */
export const getTotalMembershipPaid = async (userId: string) => {
  return prisma.payment.aggregate({
    where: {
      userId,

      purpose: PaymentPurpose.PACKAGE,

      status: PaymentStatus.COMPLETED,
    },

    _sum: {
      amount: true,
    },
  });
};

export const findMembershipInvoiceById = async (
  userId: string,
  userPackageId: string,
) => {
  return prisma.userPackage.findFirst({
    where: {
      id: userPackageId,
      user_id: userId,
    },

    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone_number: true,
        },
      },

      package: {
        select: {
          id: true,
          name: true,
          slug: true,
          tagline: true,
        },
      },

      currentPackage: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      price: {
        select: {
          id: true,
          billingCycle: true,
          months: true,
          price: true,
          originalPrice: true,
          discountPercent: true,
        },
      },

      payment: {
        select: {
          id: true,
          amount: true,
          currency: true,
          payment_id: true,
          transactionId: true,
          status: true,
          purpose: true,
          gatewayResponse: true,
          paidAt: true,
          created_at: true,
        },
      },
    },
  });
};