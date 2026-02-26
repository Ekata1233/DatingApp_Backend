import { LookingFor } from "./lookingFor.model";
import { ILookingFor } from "./lookingFor.types";

// CREATE (replace existing document)
export const createLookingFor = async (
  payload: ILookingFor
): Promise<ILookingFor> => {
  await LookingFor.deleteMany({});
  return LookingFor.create(payload);
};

// GET ALL
export const getAllLookingFor = async (): Promise<ILookingFor[]> => {
  return LookingFor.find().lean();
};

// DELETE (all)
export const deleteLookingFor = async (): Promise<void> => {
  await LookingFor.deleteMany({});
};
