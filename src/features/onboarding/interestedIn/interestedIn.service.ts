import { InterestedIn } from "./interestedIn.model";
import { IInterestedIn } from "./interestedIn.types";

export const createInterestedIn = (
  payload: IInterestedIn
): Promise<IInterestedIn> => {
  return InterestedIn.create(payload);
};

export const getAllInterestedIn = (): Promise<IInterestedIn[]> => {
  return InterestedIn.find().lean();
};
