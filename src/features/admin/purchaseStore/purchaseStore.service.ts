import { StoreItemType } from "@prisma/client";
import { createStoreFeatureRepo, createStoreInfoRepo, createStorePackRepo, deleteStoreInfoRepo, deleteStorePackRepo, findFeatureByType, findPackByQuantity, findStoreInfoById, findStoreInfoByTitle, findStorePackById, getStoreDataRepository,  getUserComplimentBalanceRepo,  getUserRoseBalanceRepo, updateStoreFeatureRepo, updateStoreInfoRepo,  updateStorePackRepo } from "./purchaseStore.repository";
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

export const getStoreAllService = async (
  itemType: StoreItemType,
  
) => {
  const store = await getStoreDataRepository(itemType);
  
  return {
    itemType,
    
    features: store.features,
    packs: store.packs,
    info: store.info,
  };
};
export const getStoreService = async (
  itemType: StoreItemType,
  userId?: string
) => {
  const store = await getStoreDataRepository(itemType);

  const data: any = {
    itemType,
   
  };

  if (userId) {
    // ROSE
    if (itemType === StoreItemType.ROSE) {
      const roseBalance = await getUserRoseBalanceRepo(userId);

      data.availableRoses = roseBalance?.totalRoses ?? 0;
    }

    // COMPLIMENT
    if (itemType === StoreItemType.COMPLIMENT) {
      const complimentBalance =
        await getUserComplimentBalanceRepo(userId);

      data.availableCompliments =
        complimentBalance?.totalCompliments ?? 0;
    }
  }
 data.packs = store.packs;
  data.info = store.info;
  
  return data;
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

