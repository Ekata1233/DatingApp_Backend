import { LookingFor } from "./lookingFor.model";
import { ILookingFor } from "./lookingFor.types";

// CREATE (upsert by flowType)
export const createLookingFor = async (
  payload: ILookingFor
): Promise<ILookingFor> => {
  const { flowType } = payload; // ✅ extract flowType

  const data = await LookingFor.findOneAndUpdate(
    { flowType }, 
    payload,
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return data;
};

export const getAllLookingFor = async (
  flowType?: string
): Promise<ILookingFor[] | ILookingFor | null> => {
  if (flowType) {
    const data = await LookingFor.findOne({ flowType }).lean();
    return data ? [data] : [];
  }

  return LookingFor.find().lean();
};