import { LookingFor } from "./lookingFor.model";
import { ILookingFor } from "./lookingFor.types";

// CREATE (upsert by flowType)
export const createLookingFor = async (
  payload: ILookingFor
): Promise<ILookingFor> => {
  const { flowType } = payload;

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

// GET ALL (with optional filter)
export const getAllLookingFor = async (
  flowType?: string
): Promise<ILookingFor[]> => {
  const filter: any = {};

  if (flowType) {
    filter.flowType = flowType;
  }

  return LookingFor.find(filter).lean();
};

// DELETE (all)
export const deleteLookingFor = async (): Promise<void> => {
  await LookingFor.deleteMany({});
};