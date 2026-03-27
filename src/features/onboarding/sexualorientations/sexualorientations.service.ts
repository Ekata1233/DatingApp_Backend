import { SexualOrientation } from "./sexualorientations.model";
import { ISexualOrientation } from "./sexualorientations.types";

// CREATE (replace existing)
export const createSexualOrientation = async (
  payload: ISexualOrientation
): Promise<ISexualOrientation> => {
  await SexualOrientation.deleteMany({});
  return SexualOrientation.create(payload);
};

// GET ALL
export const getAllSexualOrientation = async (): Promise<ISexualOrientation[]> => {
  return SexualOrientation.find().lean();
};

// DELETE ALL
export const deleteSexualOrientation = async (): Promise<void> => {
  await SexualOrientation.deleteMany({});
};
