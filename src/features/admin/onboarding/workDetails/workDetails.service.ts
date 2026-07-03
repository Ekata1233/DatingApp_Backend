import { WorkDetails } from "./workDetails.model";
import { IWorkDetails } from "./workDetails.types";

// ✅ CREATE / UPDATE (one per flowType)
export const createWorkDetails = async (
  payload: IWorkDetails
): Promise<IWorkDetails> => {
  const { flowType } = payload;

  const data = await WorkDetails.findOneAndUpdate(
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

// ✅ GET (single per flowType)
export const getAllWorkDetails = async (
  flowType?: string
): Promise<IWorkDetails[]> => {
  if (flowType) {
    const data = await WorkDetails.findOne({ flowType }).lean();
    return data ? [data] : [];
  }

  return WorkDetails.find().lean();
};