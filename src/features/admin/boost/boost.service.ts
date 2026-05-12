import { prisma } from "../../../prisma/prismaClient";
import { BoostType } from "@prisma/client";
import { CreateBoostInput } from "./boost.validation";

// export const createBoostService = async (data: CreateBoostInput) => {
//   const { options, ...boostData } = data;

//   // ✅ enum validation
//   if (!Object.values(BoostType).includes(boostData.name as BoostType)) {
//     throw new Error("Invalid boost type");
//   }

//   const boostName = boostData.name as BoostType;

//   // ✅ check existing
//   const existingBoost = await prisma.boost.findFirst({
//     where: { name: boostName },
//     include: { options: true },
//   });

//   // ✅ UPDATE FLOW
//   if (existingBoost) {
//     await prisma.boostOption.deleteMany({
//       where: { boost_id: existingBoost.id },
//     });

//     const updated = await prisma.boost.update({
//       where: { id: existingBoost.id },
//       data: {
//         name: boostName,
//         title: boostData.title,
//         description: boostData.description,

//         options: {
//           create: options.map((opt) => ({
//             label: opt.label,
//             boostCount: opt.boostCount,
//             timePerBoost: opt.timePerBoost,

//             pricePerBoost: opt.pricePerBoost.toString(),
//             discounted_price: (opt.discounted_price ?? 0).toString(),
//             discount_percent: opt.discount_percent ?? null,
//             totalPrice: opt.totalPrice.toString(),

//             is_best_value: opt.is_best_value ?? false,
//             is_popular: opt.is_popular ?? false,
//           })),
//         },
//       },
//       include: { options: true },
//     });

//     return updated;
//   }

//   // ✅ CREATE FLOW
//   const created = await prisma.boost.create({
//     data: {
//       name: boostName,
//       title: boostData.title,
//       description: boostData.description,

//       options: {
//         create: options.map((opt) => ({
//           label: opt.label,
//           boostCount: opt.boostCount,
//           timePerBoost: opt.timePerBoost,

//           pricePerBoost: opt.pricePerBoost.toString(),
//           discounted_price: (opt.discounted_price ?? 0).toString(),
//           discount_percent: opt.discount_percent ?? null,
//           totalPrice: opt.totalPrice.toString(),

//           is_best_value: opt.is_best_value ?? false,
//           is_popular: opt.is_popular ?? false,
//         })),
//       },
//     },
//     include: { options: true },
//   });

//   return created;
// };

export const createBoostService = async (data: CreateBoostInput) => {
  const { options, ...boostData } = data;

  if (!Object.values(BoostType).includes(boostData.name as BoostType)) {
    throw new Error("Invalid boost type");
  }

  const boostName = boostData.name as BoostType;

  const existingBoost = await prisma.boost.findFirst({
    where: { name: boostName },
    include: { options: true },
  });

  if (existingBoost) {
    const existingOptionIds = existingBoost.options.map((o) => o.id);

    const incomingOptionIds = options
      .filter((o) => o.id)
      .map((o) => o.id);

    // deactivate removed options
    const removedOptionIds = existingOptionIds.filter(
      (id) => !incomingOptionIds.includes(id)
    );

    await prisma.boostOption.updateMany({
      where: {
        id: {
          in: removedOptionIds,
        },
      },
      data: {
        is_active: false,
      },
    });

    // update/create options
    for (const opt of options) {
      if (opt.id) {
        await prisma.boostOption.update({
          where: { id: opt.id },
          data: {
            label: opt.label,
            boostCount: opt.boostCount,
            timePerBoost: opt.timePerBoost,
            pricePerBoost: opt.pricePerBoost,
            discounted_price: opt.discounted_price ?? 0,
            discount_percent: opt.discount_percent ?? null,
            totalPrice: opt.totalPrice,
            is_best_value: opt.is_best_value ?? false,
            is_popular: opt.is_popular ?? false,
            is_active: true,
          },
        });
      } else {
        await prisma.boostOption.create({
          data: {
            boost_id: existingBoost.id,
            label: opt.label,
            boostCount: opt.boostCount,
            timePerBoost: opt.timePerBoost,
            pricePerBoost: opt.pricePerBoost,
            discounted_price: opt.discounted_price ?? 0,
            discount_percent: opt.discount_percent ?? null,
            totalPrice: opt.totalPrice,
            is_best_value: opt.is_best_value ?? false,
            is_popular: opt.is_popular ?? false,
          },
        });
      }
    }

    return prisma.boost.findUnique({
      where: { id: existingBoost.id },
      include: {
        options: {
          where: {
            is_active: true,
          },
        },
      },
    });
  }

  // CREATE FLOW
  return prisma.boost.create({
    data: {
      name: boostName,
      title: boostData.title,
      description: boostData.description,
      options: {
        create: options.map((opt) => ({
          label: opt.label,
          boostCount: opt.boostCount,
          timePerBoost: opt.timePerBoost,
          pricePerBoost: opt.pricePerBoost,
          discounted_price: opt.discounted_price ?? 0,
          discount_percent: opt.discount_percent ?? null,
          totalPrice: opt.totalPrice,
          is_best_value: opt.is_best_value ?? false,
          is_popular: opt.is_popular ?? false,
        })),
      },
    },
    include: {
      options: true,
    },
  });
};

// ✅ GET API
export const getBoostsService = async () => {
  return prisma.boost.findMany({
    include: { options: true },
    orderBy: { created_at: "desc" },
  });
};
