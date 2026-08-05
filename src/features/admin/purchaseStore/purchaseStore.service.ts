import { StoreItemType } from "@prisma/client";
import { createStoreFeatureRepo, createStorePackRepo, findFeatureByType, findPackByQuantity, getStoreDataRepository, updateStoreFeatureRepo, updateStorePackRepo } from "./purchaseStore.repository";
import { CreateStoreFeatureDTO, CreateStorePackDTO } from "./purchaseStore.types";

export const createStoreFeatureService = async (
  body: CreateStoreFeatureDTO
) => {
  const exists = await findFeatureByType(
    body.itemType,
    body.feature
  );

  // If same itemType + feature exists, update it
  if (exists) {
    return await updateStoreFeatureRepo(exists.id, body);
  }

  return await createStoreFeatureRepo(body);
};

export const createStorePackService = async (
  body: CreateStorePackDTO
) => {
  const exists = await findPackByQuantity(
    body.itemType,
    body.quantity
  );

  // Same itemType + quantity -> update
  if (exists) {
    return await updateStorePackRepo(exists.id, body);
  }

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