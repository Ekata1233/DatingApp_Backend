import { prisma } from "../../../prisma/prismaClient";

import { getBlockedUserRecordsRepository } from "./block.repository";

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





export const getBlockedUsersService = async (
  userId: string,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  // ==========================================
  // 1. GET USERS BLOCKED BY CURRENT USER
  // ==========================================

  const blockRecords =
    await getBlockedUserRecordsRepository(
      userId,
    );

  if (blockRecords.length === 0) {
    return [];
  }

  // ==========================================
  // 2. GET BLOCKED USER IDS
  // ==========================================

  const blockedUserIds =
    blockRecords.map(
      (item) => item.blockedId,
    );

  // ==========================================
  // 3. GET BLOCKED USER DETAILS
  // ==========================================

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: blockedUserIds,
      },

      deleted_at: null,
    },

    select: {
      id: true,
      full_name: true,
      phone_number: true,

      photos: {
        take: 1,
      },
    },
  });

  // ==========================================
  // 4. CREATE USER MAP
  // ==========================================

  const userMap = new Map(
    users.map((user) => [
      user.id,
      user,
    ]),
  );

  // ==========================================
  // 5. FINAL RESPONSE
  // ==========================================

  return blockRecords
    .map((block) => {
      const blockedUser =
        userMap.get(block.blockedId);

      if (!blockedUser) {
        return null;
      }

      return {
        blockId: block.id,

        userId: blockedUser.id,

        name:
          blockedUser.full_name ??
          maskPhoneNumber(
            blockedUser.phone_number,
          ),

        phoneNumber:
          blockedUser.phone_number,

        profilePhoto:
          blockedUser.photos?.[0] ??
          null,

        status: "Blocked",

        blockedAt: block.createdAt,
      };
    })
    .filter(Boolean);
};

// ==========================================
// MASK PHONE
// ==========================================

const maskPhoneNumber = (
  phone?: string | null,
) => {
  if (!phone) {
    return "Unknown";
  }

  if (phone.length <= 4) {
    return `Unknown ${phone}`;
  }

  return `Unknown ${phone.slice(
    0,
    3,
  )}••••${phone.slice(-4)}`;
};