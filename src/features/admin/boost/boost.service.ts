import { prisma } from "../../../prisma/prismaClient";
import { BoostType } from "@prisma/client";
import { CreatePackageInput } from "./boost.validation";

export const createBoostService = async (data: CreatePackageInput) => {
  const { options, ...boostData } = data;

  // ✅ enum validation
  if (!Object.values(BoostType).includes(boostData.name as BoostType)) {
    throw new Error("Invalid boost type");
  }

  const boostName = boostData.name as BoostType;

  // ✅ check existing
  const existingBoost = await prisma.boost.findFirst({
    where: { name: boostName },
    include: { options: true },
  });

  // ✅ UPDATE FLOW
  if (existingBoost) {
    await prisma.boostOption.deleteMany({
      where: { boost_id: existingBoost.id },
    });

    const updated = await prisma.boost.update({
      where: { id: existingBoost.id },
      data: {
        name: boostName,
        title: boostData.title,
        description: boostData.description,

        options: {
          create: options.map((opt) => ({
            label: opt.label,
            boostCount: opt.boostCount,
            timePerBoost: opt.timePerBoost,

            pricePerBoost: opt.pricePerBoost.toString(),
            discounted_price: (opt.discounted_price ?? 0).toString(),
            discount_percent: opt.discount_percent ?? null,
            totalPrice: opt.totalPrice.toString(),

            is_best_value: opt.is_best_value ?? false,
            is_popular: opt.is_popular ?? false,
          })),
        },
      },
      include: { options: true },
    });

    return updated;
  }

  // ✅ CREATE FLOW
  const created = await prisma.boost.create({
    data: {
      name: boostName,
      title: boostData.title,
      description: boostData.description,

      options: {
        create: options.map((opt) => ({
          label: opt.label,
          boostCount: opt.boostCount,
          timePerBoost: opt.timePerBoost,

          pricePerBoost: opt.pricePerBoost.toString(),
          discounted_price: (opt.discounted_price ?? 0).toString(),
          discount_percent: opt.discount_percent ?? null,
          totalPrice: opt.totalPrice.toString(),

          is_best_value: opt.is_best_value ?? false,
          is_popular: opt.is_popular ?? false,
        })),
      },
    },
    include: { options: true },
  });

  return created;
};



// ✅ GET API
export const getBoostsService = async () => {
  return prisma.boost.findMany({
    include: { options: true },
    orderBy: { created_at: "desc" },
  });
};
