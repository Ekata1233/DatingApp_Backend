import { Prisma } from "@prisma/client";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const generateReferralCode = async (
  tx: Prisma.TransactionClient
): Promise<string> => {
  while (true) {
    let code = "";

    for (let i = 0; i < 8; i++) {
      code += CHARACTERS.charAt(
        Math.floor(Math.random() * CHARACTERS.length)
      );
    }

    const exists = await tx.user.findUnique({
      where: {
        referralCode: code,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      return code;
    }
  }
};