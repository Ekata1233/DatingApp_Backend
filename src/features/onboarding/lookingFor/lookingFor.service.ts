import { LookingFor } from "./lookingFor.model";
import { ILookingFor } from "./lookingFor.types";

// CREATE (upsert by flowType)
export const createLookingFor = async (
  payload: ILookingFor
): Promise<ILookingFor> => {
  

  const data = await LookingFor.findOneAndUpdate(
    {  },
    payload,
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return data;
};

// GET ALL (with optional filter)
export const getAllLookingFor = async (
): Promise<ILookingFor[]> => {
  const filter: any = {};

  

  return LookingFor.find(filter).lean();
};

// DELETE (all)
export const deleteLookingFor = async (): Promise<void> => {
  await LookingFor.deleteMany({});
};