import { LookingFor } from "./lookingFor.model";
import { ILookingFor } from "./lookingFor.types";

// CREATE (replace existing document)
export const createLookingFor = async (
  payload: ILookingFor
): Promise<ILookingFor> => {
  const { flowType } = payload;

  const data = await LookingFor.findOneAndUpdate(
    { flowType },           // ✅ find by flowType
    payload,                // ✅ new data
    {
      new: true,            // return updated doc
      upsert: true,         // create if not exist
      runValidators: true,
    }
  );

  return data;
};

// GET ALL
export const getAllLookingFor = async (): Promise<ILookingFor[]> => {
  return LookingFor.find().lean();
};

// DELETE (all)
export const deleteLookingFor = async (): Promise<void> => {
  await LookingFor.deleteMany({});
};
