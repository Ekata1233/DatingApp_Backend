import { prisma } from "../../../prisma/prismaClient";


export const blockUserService = async (
  blockerId: string,
  blockedId: string
) => {
  // 1. Validation
  if (!blockedId) {
    throw new Error("Blocked user ID is required");
  }

  if (blockerId === blockedId) {
    throw new Error("You cannot block yourself");
  }

  // 2. Check if user exists
  const userExists = await prisma.user.findUnique({
    where: { id: blockedId },
  });

  if (!userExists) {
    throw new Error("User not found");
  }

  // 3. Check already blocked
  const existingBlock = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
  });

  if (existingBlock) {
    throw new Error("User already blocked");
  }

  // 4. Create block
  const block = await prisma.userBlock.create({
    data: {
      blockerId,
      blockedId,
    },
  });

    return block;
};