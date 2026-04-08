import { InterestedIn } from "./interestedIn.model";
import { IInterestedIn } from "./interestedIn.types";

/**
 * Always keep ONLY ONE document per flowType.
 * When creating → update if exists, else create.
 */
export const createInterestedIn = async (
  payload: IInterestedIn
): Promise<IInterestedIn> => {
  const { flowType } = payload;

  const data = await InterestedIn.findOneAndUpdate(
    { flowType }, // ✅ only this flowType
    payload,
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return data;
};

export const getAllInterestedIn = async (
  flowType?: string
): Promise<IInterestedIn[] | IInterestedIn | null> => {
  if (flowType) {
    const data = await InterestedIn.findOne({ flowType }).lean();
    return data ? [data] : [];
  }

  return InterestedIn.find().lean();
};