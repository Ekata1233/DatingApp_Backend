import { StoreItemType } from "@prisma/client";
import { createStoreFeatureRepo, createStorePackRepo, findFeatureByType, getStoreDataRepository } from "./purchaseStore.repository";
import { CreateStoreFeatureDTO, CreateStorePackDTO } from "./purchaseStore.types";


export const createStoreFeatureService = async (
  body: CreateStoreFeatureDTO
) => {
  const exists = await findFeatureByType(body.feature);

  if (exists) {
    throw new Error("FEATURE_ALREADY_EXISTS");
  }

  return await createStoreFeatureRepo(body);
};

export const createStorePackService = async (
  body: CreateStorePackDTO
) => {
  return await createStorePackRepo(body);
};

export const getStoreService = async (
  itemType: StoreItemType
) => {
  const store = await getStoreDataRepository(itemType);

  return {
    itemType,
    features: store.features,
    packs: store.packs,
  };
};

export const getRoseStoreService = () => {
  return getStoreService(StoreItemType.ROSE);
};

export const getComplimentStoreService = () => {
  return getStoreService(StoreItemType.COMPLIMENT);
};