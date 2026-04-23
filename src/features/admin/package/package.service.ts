import { prisma } from "../../../prisma/prismaClient";
import { CreatePackageInput } from "./package.validation";

export const createPackageService = async (data: CreatePackageInput) => {
  const { options, ...packageData } = data;

  // 1. Check if package with same name exists
  const existingPackage = await prisma.package.findFirst({
    where: {
      name: packageData.name,
    },
    include: {
      options: true,
    },
  });

  // 2. If exists → delete old options + update package
  if (existingPackage) {
    // delete old options
    await prisma.packageOption.deleteMany({
      where: {
        package_id: existingPackage.id,
      },
    });

    // update package + insert new options
    const updated = await prisma.package.update({
      where: {
        id: existingPackage.id,
      },
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
            is_popular: opt.is_popular ?? false,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    return updated;
  }

  // 3. If NOT exists → create new
  const created = await prisma.package.create({
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
          is_popular: opt.is_popular ?? false,
        })),
      },
    },
    include: {
      options: true,
    },
  });

  return created;
};


export const getPackagesService = async () => {
  const result = await prisma.package.findMany({
    include: {
      options: true
    },
    orderBy: {
      created_at: "desc"
    }
  });

  return result;
};
