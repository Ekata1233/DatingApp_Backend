import { ReligionData } from "./religion.model";
import { IReligionData } from "./religion.types";

// ✅ CREATE / UPDATE (upsert)
export const createReligionData = async (
  payload: IReligionData
): Promise<IReligionData> => {
  const { flowType } = payload;

  const data = await ReligionData.findOneAndUpdate(
    { flowType }, // ✅ ONLY flowType
    payload,
    {
      new: true,
      upsert: true, // create if not exists
      runValidators: true,
    }
  );

  return data;
};

// ✅ GET ALL (optional flowType filter)
export const getAllReligionData = async (
  flowType?: string
): Promise<IReligionData[]> => {
  if (flowType) {
    const data = await ReligionData.findOne({ flowType }).lean();
    return data ? [data] : []; // ✅ always single
  }

  return ReligionData.find().lean();
};