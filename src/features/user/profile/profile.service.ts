import { prisma } from "../../../prisma/prismaClient";

export const updateNameService = async (userId: string, name: string) => {
  if (!userId) throw new Error("User ID is missing");

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      onboarding_step: 2,
    },
  });

  return user;
};
