import { prisma } from "../../../prisma/prismaClient";


export const blockUserService = async (
  blockerId: string,
  blockedId: string
) => {
  // 1. Validation
  console.log("=== BLOCK USER START ===");
  console.log("blockerId:", blockerId);
  console.log("blockedId:", blockedId);
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

  console.log(
    "existingBlock:",
    existingBlock,
  );

  if (existingBlock) {
    throw new Error("User already blocked");
  }
  console.log("BLOCK REQUEST:", {
    blockerId,
    blockedId,
  });

  // 4. Create block
  const block = await prisma.userBlock.create({
    data: {
      blockerId,
      blockedId,
    },
  });

  console.log("BLOCK CREATED:", block);

  const verifyBlock = await prisma.userBlock.findFirst({
    where: {
      OR: [
        {
          blockerId,
          blockedId,
        },
        {
          blockerId: blockedId,
          blockedId: blockerId,
        },
      ],
    },
  });

  console.log("VERIFY BLOCK:", verifyBlock);

  return {
    blockerId,
    blockedId,
    isBlocked: true,
    blockId: block.id,
  };
};

export const unblockUserService = async (
  blockerId: string,
  blockedId: string
) => {
  console.log("=== UNBLOCK USER START ===");
  console.log("blockerId:", blockerId);
  console.log("blockedId:", blockedId);

  if (!blockedId) {
    throw new Error("Blocked user ID is required");
  }

  if (blockerId === blockedId) {
    throw new Error("Invalid user");
  }

  // Check block exists
  const existingBlock = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
  });

  console.log("existingBlock:", existingBlock);

  if (!existingBlock) {
    throw new Error("User is not blocked");
  }

  // Delete block
  await prisma.userBlock.delete({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
  });

  console.log("USER UNBLOCKED:", {
    blockerId,
    blockedId,
  });

  return {
    blockerId,
    blockedId,
    isBlocked: false,
    message: "User unblocked successfully",
  };
};