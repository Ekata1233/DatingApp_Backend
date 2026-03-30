import { Lifestyle } from "./lifestyle.model";
import { ILifestyle } from "./lifestyle.types";

/**
 * Always keep ONLY ONE document.
 * When creating new → delete old first.
 */
export const createLifestyle = async (
  payload: ILifestyle
): Promise<ILifestyle> => {
  const { flowType } = payload;

  const data = await Lifestyle.findOneAndUpdate(
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

export const getLifestyle = async (
  flowType?: string
): Promise<ILifestyle[] | ILifestyle | null> => {
  if (flowType) {
    const data = await Lifestyle.findOne({ flowType }).lean();
    return data ? [data] : [];
  }

  return Lifestyle.find().lean();
};

// export const deleteLifestyle = async (): Promise<void> => {
//   await Lifestyle.deleteMany({});
// };
