import { StoreItemType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { CreateStoreFeatureDTO, CreateStorePackDTO } from "./purchaseStore.types";
import { CreateStoreInfoDTO } from "./purchaseStore.validation";


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
  itemType: StoreItemType,
  feature: string
) => {
  return prisma.storeFeature.findFirst({
    where: {
      itemType,
      feature: feature as any,
    },
  });
};
export const updateStoreFeatureRepo = (
  id: string,
  data: CreateStoreFeatureDTO
) => {
  return prisma.storeFeature.update({
    where: { id },
    data,
  });
};
export const findPackByQuantity = (
  itemType: StoreItemType,
  quantity: number
) => {
  return prisma.storePack.findFirst({
    where: {
      itemType,
      quantity,
    },
  });
};
export const updateStorePackRepo = (
  id: string,
  data: CreateStorePackDTO
) => {
  return prisma.storePack.update({
    where: { id },
    data,
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

  export const createStoreInfoRepo = (
  data: CreateStoreInfoDTO
) => {
  return prisma.storeInfo.create({
    data,
  });
};

export const updateStoreInfoRepo = (
  id: string,
  data: CreateStoreInfoDTO
) => {
  return prisma.storeInfo.update({
    where: { id },
    data,
  });
};

export const findStoreInfoByTitle = (
  itemType: StoreItemType,
  title: string
) => {
  return prisma.storeInfo.findFirst({
    where: {
      itemType,
      title,
    },
  });
};

export const getStoreInfoRepo = (
  itemType: StoreItemType
) => {
  return prisma.storeInfo.findMany({
    where: {
      itemType,
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
};