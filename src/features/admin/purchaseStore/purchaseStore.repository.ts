import { StoreItemType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { CreateStoreFeatureDTO, CreateStoreInfoDTO, CreateStorePackDTO, UpdateStoreInfoDTO, UpdateStorePackDTO } from "./purchaseStore.types";


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
  data: UpdateStorePackDTO
) => {
  return prisma.storePack.update({
    where: { id },
    data,
  });
};
export const findStorePackById = (
  id: string
) => {
  return prisma.storePack.findUnique({
    where: {
      id,
    },
  });
};
export const deleteStorePackRepo = (
  id: string
) => {
  return prisma.storePack.delete({
    where: {
      id,
    },
  });
};
export const getUserRoseBalanceRepo = (userId: string) => {
  return prisma.userRoseBalance.findUnique({
    where: {
      userId,
    },
    select: {
      totalRoses: true,
    },
  });
};
export const getStoreDataRepository = async (
  itemType: StoreItemType
) => {
  const [features, packs, info] = await Promise.all([
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

    prisma.storeInfo.findMany({
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
    info,
  };
};

  export const createStoreInfoRepo = (
  data: CreateStoreInfoDTO
) => {
  return prisma.storeInfo.create({
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
export const updateStoreInfoRepo = (
  id: string,
  data: UpdateStoreInfoDTO
) => {
  return prisma.storeInfo.update({
    where: { id },
    data,
  });
};
export const findStoreInfoById = (
  id: string
) => {
  return prisma.storeInfo.findUnique({
    where: { id },
  });
};

export const deleteStoreInfoRepo = (
  id: string
) => {
  return prisma.storeInfo.delete({
    where: { id },
  });
};