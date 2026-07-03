import { DreamsFuture } from "./dreamsFuture.model";
import { IDreamsFuture } from "./dreamsFuture.types";

// ✅ CREATE / UPDATE
export const createDreamsFuture = async (
  payload: IDreamsFuture
): Promise<IDreamsFuture> => {
  const { flowType } = payload;

  const data = await DreamsFuture.findOneAndUpdate(
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

// ✅ GET
export const getAllDreamsFuture = async (
  flowType?: string
): Promise<IDreamsFuture[]> => {
  if (flowType) {
    const data = await DreamsFuture.findOne({ flowType }).lean();
    return data ? [data] : [];
  }

  return DreamsFuture.find().lean();
};