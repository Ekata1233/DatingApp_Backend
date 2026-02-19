import { RealYouMatters } from "./realYouMatters.model";
import { IRealYouMatters } from "./realYouMatters.types";


export const createRealYouMatters = async (
  payload: IRealYouMatters
): Promise<IRealYouMatters> => {
  // Remove existing data
  await RealYouMatters.deleteMany({});

  // Insert fresh data
  return RealYouMatters.create(payload);
};

export const getRealYouMatters = async (): Promise<IRealYouMatters | null> => {
  return RealYouMatters.findOne().lean();
};

export const deleteRealYouMatters = async (): Promise<void> => {
  await RealYouMatters.deleteMany({});
};
