import { StoreItemType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { CreateStoreFeatureDTO, CreateStorePackDTO } from "./purchaseStore.types";


export const createStoreFeatureRepo = (
  data: CreateStoreFeatureDTO
) => {
  return prisma.storeFeature.create({
    data,
  });
};

export const createStorePackRepo = (
  data: CreateStorePackDTO
) => {
  return prisma.storePack.create({
    data,
  });
};

export const findFeatureByType = (
  feature: string
) => {
  return prisma.storeFeature.findUnique({
    where: { feature: feature as any },
  });
};

export const getStoreDataRepository = async (
    itemType: StoreItemType
  ) => {
    const [features, packs] = await Promise.all([
      prisma.storeFeature.findMany({
        where: {
          itemType,
          enabled: true,
        },
        orderBy: {
          feature: "asc",
        },
      }),
  
      prisma.storePack.findMany({
        where: {
          itemType,
          isActive: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      }),
    ]);
  
    return {
      features,
      packs,
    };
  };