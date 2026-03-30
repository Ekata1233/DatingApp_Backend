import { ThingsYouLove } from "./thingsYouLove.model";
import { IThingsYouLove } from "./thingsYouLove.types";

/**
 * Always keep ONLY ONE document.
 * When creating new → delete old first.
 */
export const createThingsYouLove = async (
  payload: IThingsYouLove
): Promise<IThingsYouLove> => {
  const { flowType } = payload;

  const data = await ThingsYouLove.findOneAndUpdate(
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

export const getThingsYouLove = async (
  flowType?: string
): Promise<IThingsYouLove[] | IThingsYouLove | null> => {
  if (flowType) {
    const data = await ThingsYouLove.findOne({ flowType }).lean();
    return data ? [data] : [];
  }

  return ThingsYouLove.find().lean();
};

// export const deleteThingsYouLove = async (): Promise<void> => {
//   await ThingsYouLove.deleteMany({});
// };
