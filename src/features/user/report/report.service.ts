import { prisma } from "../../../prisma/prismaClient";


type CreateUserReportPayload = {
  reportedId: string;
  reason: string;
  description?: string | null;
};

export const createUserReportService = async (
  reporterId: string,
  payload: CreateUserReportPayload
) => {
  const { reportedId, reason, description } = payload;

  // Cannot report yourself
  if (reporterId === reportedId) {
    throw new Error("You cannot report yourself");
  }

  // Check reported user exists
  const reportedUser = await prisma.user.findUnique({
    where: {
      id: reportedId,
    },
    select: {
      id: true,
    },
  });

  if (!reportedUser) {
    throw new Error("User not found");
  }

  // Because your schema has:
  // @@unique([reporterId, reportedId])
  const existingReport = await prisma.userReport.findUnique({
    where: {
      reporterId_reportedId: {
        reporterId,
        reportedId,
      },
    },
  });

  if (existingReport) {
    throw new Error("You have already reported this user");
  }

  const report = await prisma.userReport.create({
    data: {
      reporterId,
      reportedId,
      reason: reason.trim(),
      description: description?.trim() || null,
    },
    select: {
      id: true,
      reportedId: true,
      reason: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });

  return report;
};


export const getMyReportsService = async (
  userId: string
) => {
  const reports = await prisma.userReport.findMany({
    where: {
      reporterId: userId,
    },

    include: {
      reportedUser: {
        select: {
          id: true,
          full_name: true,

          photos: {
            orderBy: {
              order: "asc",
            },
            take: 1,
            select: {
              media_url: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return reports.map((report) => ({
    id: report.id,

    reportedUser: {
      id: report.reportedUser.id,
      fullName: report.reportedUser.full_name,
      photo:
        report.reportedUser.photos[0]?.media_url ?? null,
    },

    reason: report.reason,
    description: report.description,

    status: report.status,
    actionTaken: report.actionTaken,

    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }));
};

export const getMyReportByIdService = async (
  userId: string,
  reportId: string
) => {
  const report = await prisma.userReport.findFirst({
    where: {
      id: reportId,
      reporterId: userId,
    },

    include: {
      reportedUser: {
        select: {
          id: true,
          full_name: true,

          photos: {
            orderBy: {
              order: "asc",
            },
            take: 1,
            select: {
              media_url: true,
            },
          },
        },
      },
    },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  return {
    id: report.id,

    reportedUser: {
      id: report.reportedUser.id,
      fullName: report.reportedUser.full_name,
      photo:
        report.reportedUser.photos[0]?.media_url ?? null,
    },

    reason: report.reason,
    description: report.description,

    status: report.status,
    actionTaken: report.actionTaken,

    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
};


type GetReportsParams = {
  status?: string;
  reason?: string;
  reporterId?: string;
  reportedId?: string;
  page: number;
  limit: number;
};

export const getAllUserReportsService = async ({
  status,
  reason,
  reporterId,
  reportedId,
  page,
  limit,
}: GetReportsParams) => {
  const safePage = Math.max(page || 1, 1);
  const safeLimit = Math.min(
    Math.max(limit || 20, 1),
    100
  );

  const skip = (safePage - 1) * safeLimit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (reason) {
    where.reason = {
      contains: reason,
      mode: "insensitive",
    };
  }

  if (reporterId) {
    where.reporterId = reporterId;
  }

  if (reportedId) {
    where.reportedId = reportedId;
  }

  const [reports, total] = await Promise.all([
    prisma.userReport.findMany({
      where,

      include: {
        reporter: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,

            photos: {
              orderBy: {
                order: "asc",
              },
              take: 1,
              select: {
                media_url: true,
              },
            },
          },
        },

        reportedUser: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,

            photos: {
              orderBy: {
                order: "asc",
              },
              take: 1,
              select: {
                media_url: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip,
      take: safeLimit,
    }),

    prisma.userReport.count({
      where,
    }),
  ]);

  return {
    count: reports.length,

    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },

    data: reports.map((report) => ({
      id: report.id,

      reporter: {
        id: report.reporter.id,
        fullName: report.reporter.full_name,
        email: report.reporter.email,
        phoneNumber: report.reporter.phone_number,
        photo:
          report.reporter.photos[0]?.media_url ?? null,
      },

      reportedUser: {
        id: report.reportedUser.id,
        fullName: report.reportedUser.full_name,
        email: report.reportedUser.email,
        phoneNumber: report.reportedUser.phone_number,
        photo:
          report.reportedUser.photos[0]?.media_url ?? null,
      },

      reason: report.reason,
      description: report.description,

      status: report.status,
      actionTaken: report.actionTaken,

      adminNote: report.adminNote,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,

      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    })),
  };
};

export const getAdminReportByIdService = async (
  reportId: string
) => {
  const report = await prisma.userReport.findUnique({
    where: {
      id: reportId,
    },

    include: {
      reporter: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone_number: true,

          photos: {
            orderBy: {
              order: "asc",
            },
            take: 1,
            select: {
              media_url: true,
            },
          },
        },
      },

      reportedUser: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone_number: true,

          photos: {
            orderBy: {
              order: "asc",
            },
            take: 1,
            select: {
              media_url: true,
            },
          },
        },
      },
    },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  return {
    id: report.id,

    reporter: {
      id: report.reporter.id,
      fullName: report.reporter.full_name,
      email: report.reporter.email,
      phoneNumber: report.reporter.phone_number,
      photo:
        report.reporter.photos[0]?.media_url ?? null,
    },

    reportedUser: {
      id: report.reportedUser.id,
      fullName: report.reportedUser.full_name,
      email: report.reportedUser.email,
      phoneNumber: report.reportedUser.phone_number,
      photo:
        report.reportedUser.photos[0]?.media_url ?? null,
    },

    reason: report.reason,
    description: report.description,

    status: report.status,
    actionTaken: report.actionTaken,

    adminNote: report.adminNote,
    reviewedBy: report.reviewedBy,
    reviewedAt: report.reviewedAt,

    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
};