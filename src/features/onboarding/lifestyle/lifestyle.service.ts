import { Lifestyle } from "./lifestyle.model";
import { ILifestyle } from "./lifestyle.types";

/**
 * Always keep ONLY ONE document.
 * When creating new → delete old first.
 */
export const createLifestyle = async (
  payload: ILifestyle
): Promise<ILifestyle> => {
  // Remove existing data
  await Lifestyle.deleteMany({});

  // Insert fresh data
  return Lifestyle.create(payload);
};

export const getLifestyle = async (): Promise<ILifestyle | null> => {
  return Lifestyle.findOne().lean();
};

export const deleteLifestyle = async (): Promise<void> => {
  await Lifestyle.deleteMany({});
};
