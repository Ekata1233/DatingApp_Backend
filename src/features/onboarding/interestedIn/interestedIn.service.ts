import { InterestedIn } from "./interestedIn.model";
import { IInterestedIn } from "./interestedIn.types";

// CREATE (replace existing document)
export const createInterestedIn = async (
  payload: IInterestedIn
): Promise<IInterestedIn> => {
  // Delete existing document (if any)
  await InterestedIn.deleteMany({});
  return InterestedIn.create(payload);
};

// GET ALL
export const getAllInterestedIn = async (): Promise<IInterestedIn[]> => {
  return InterestedIn.find().lean();
};

// DELETE (all)
export const deleteInterestedIn = async (): Promise<void> => {
  await InterestedIn.deleteMany({});
};
