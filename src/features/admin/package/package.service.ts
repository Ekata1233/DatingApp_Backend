import { prisma } from "../../../prisma/prismaClient";
import { CreatePackageInput } from "./package.validation";

export const createPackageService = async (data: CreatePackageInput) => {
  const { options, ...packageData } = data;

  const result = await prisma.package.create({
    data: {
      ...packageData,

      options: {
        create: options.map((opt) => ({
          label: opt.label,
          boostCount: opt.boostCount,
          pricePerBoost: opt.pricePerBoost,
          discounted_price: opt.discounted_price ?? null,
          discount_percent: opt.discount_percent ?? null,
          totalPrice: opt.totalPrice,
          is_best_value: opt.is_best_value ?? false,
          is_popular: opt.is_popular ?? false
        }))
      }
    },
    include: {
      options: true
    }
  });

  return result;
};
