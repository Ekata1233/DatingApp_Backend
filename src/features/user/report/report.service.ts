import { prisma } from "../../../prisma/prismaClient";


export const reportUserService = async (
  reporterId: string,
  reportedId: string
) => {
  // 1. Validation
  if (!reportedId) {
    throw new Error("reported user ID is required");
  }

  if (reporterId === reportedId) {
    throw new Error("You cannot report yourself");
  }

  // 2. Check if user exists
  const userExists = await prisma.user.findUnique({
    where: { id: reportedId },
  });

  if (!userExists) {
    throw new Error("User not found");
  }

  // 3. Check already reported
  const existingreport = await prisma.userReport.findUnique({
    where: {
      reporterId_reportedId: {
        reporterId,
        reportedId,
      },
    },
  });

  if (existingreport) {
    throw new Error("User already reported");
  }

  // 4. Create report
  const report = await prisma.userReport.create({
    data: {
      reporterId,
      reportedId,
    },
  });

    return report;
};