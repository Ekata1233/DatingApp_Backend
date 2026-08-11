import { StoreItemType } from "@prisma/client";
import { createStoreFeatureRepo, createStoreInfoRepo, createStorePackRepo, deleteStoreInfoRepo, deleteStorePackRepo, findFeatureByType, findPackByQuantity, findStoreInfoById, findStoreInfoByTitle, findStorePackById, getStoreDataRepository, updateStoreFeatureRepo, updateStoreInfoRepo,  updateStorePackRepo } from "./purchaseStore.repository";
import { CreateStoreFeatureDTO, CreateStoreInfoDTO, CreateStorePackDTO ,UpdateStoreInfoDTO, UpdateStorePackDTO,} from "./purchaseStore.types";


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

export const createStoreInfoService = async (
  body: CreateStoreInfoDTO
) => {
  const exists = await findStoreInfoByTitle(
    body.itemType,
    body.title
  );

  // Same itemType + title -> update
  if (exists) {
    return await updateStoreInfoRepo(exists.id, body);
  }

  return await createStoreInfoRepo(body);
};
export const updateStorePackService = async (
  id: string,
  body: UpdateStorePackDTO
) => {
  const exists = await findStorePackById(id);

  if (!exists) {
    throw new Error("Store pack not found");
  }

  return await updateStorePackRepo(id, body);
};
export const deleteStorePackService = async (
  id: string
) => {
  const exists = await findStorePackById(id);

  if (!exists) {
    throw new Error("Store pack not found");
  }

  return await deleteStorePackRepo(id);
};

export const getStoreService = async (
  itemType: StoreItemType
) => {
  const store = await getStoreDataRepository(itemType);

  return {
    itemType,
    features: store.features,
    packs: store.packs,
    info: store.info,
  };
};

export const getRoseStoreService = () => {
  return getStoreService(StoreItemType.ROSE);
};

export const getComplimentStoreService = () => {
  return getStoreService(StoreItemType.COMPLIMENT);
};

export const updateStoreInfoService = async (
  id: string,
  body: UpdateStoreInfoDTO
) => {
  const exists = await findStoreInfoById(id);

  if (!exists) {
    throw new Error("Store info not found");
  }

  return await updateStoreInfoRepo(id, body);
};
export const deleteStoreInfoService = async (
  id: string
) => {
  const exists = await findStoreInfoById(id);

  if (!exists) {
    throw new Error("Store info not found");
  }

  return await deleteStoreInfoRepo(id);
};

