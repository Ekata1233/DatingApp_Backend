import { prisma } from "../../../prisma/prismaClient";

export const getAllUsers = async () => {
  return prisma.user.findMany();
};

export const deleteUser = async (id: string) => {
  return prisma.user.delete({
    where: { id },
  });
};