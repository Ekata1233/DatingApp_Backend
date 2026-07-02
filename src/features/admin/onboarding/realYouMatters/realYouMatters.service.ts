import { RealYouMatters } from "./realYouMatters.model";
import { IRealYouMatters } from "./realYouMatters.types";


export const createRealYouMatters = async (
  payload: IRealYouMatters
): Promise<IRealYouMatters> => {
  const { flowType } = payload;

  const data = await RealYouMatters.findOneAndUpdate(
    { flowType }, // ✅ only this flowType
    payload,
    {
      new: true,
      upsert: true, // create if not exists
      runValidators: true,
    }
  );

  return data;
};

export const getRealYouMatters = async (
  flowType?: string
): Promise<IRealYouMatters[] | IRealYouMatters | null> => {
  if (flowType) {
    const data = await RealYouMatters.findOne({ flowType }).lean();
    return data ? [data] : [];
  }

  return RealYouMatters.find().lean();
};

// export const deleteRealYouMatters = async (): Promise<void> => {
//   await RealYouMatters.deleteMany({});
// };
