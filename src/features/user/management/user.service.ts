import { prisma } from "../../../prisma/prismaClient";

//SERVICE LAYER FOR ALL USER MANAGEMENT
export const getAllUsers = async () => {
  return prisma.user.findMany();
};

//SERVICE LAYER FOR FETCHING SINGLE USER
export const getSingleUser = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id: id,
    },
  });
};