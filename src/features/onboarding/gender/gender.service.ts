// gender.service.ts
import { GenderModel } from "./gender.model";
import { IGender } from "./gender.types";

/**
 * Always keep ONLY ONE document.
 * When creating new → delete old first.
 */
export const createGender = async (payload: IGender): Promise<IGender> => {
  // Remove existing data
  await GenderModel.deleteMany({});

  // Insert fresh data
  return GenderModel.create(payload);
};

// GET ALL (returns array with single document or empty array)
export const getAllGenders = async (): Promise<IGender[]> => {
  return GenderModel.find().sort({ createdAt: -1 }).lean();
};

// DELETE ALL
export const deleteAllGenders = async (): Promise<void> => {
  await GenderModel.deleteMany({});
};