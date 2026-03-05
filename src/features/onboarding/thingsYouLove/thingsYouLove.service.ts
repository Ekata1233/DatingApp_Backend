import { ThingsYouLove } from "./thingsYouLove.model";
import { IThingsYouLove } from "./thingsYouLove.types";

/**
 * Always keep ONLY ONE document.
 * When creating new → delete old first.
 */
export const createThingsYouLove = async (
  payload: IThingsYouLove
): Promise<IThingsYouLove> => {
  // Remove existing data
  await ThingsYouLove.deleteMany({});

  // Insert fresh data
  return ThingsYouLove.create(payload);
};

export const getThingsYouLove = async (): Promise<IThingsYouLove | null> => {
  return ThingsYouLove.findOne().lean();
};

export const deleteThingsYouLove = async (): Promise<void> => {
  await ThingsYouLove.deleteMany({});
};
