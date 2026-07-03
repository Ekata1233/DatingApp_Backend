import { InterestHobbies } from "./interestHobbies.model";
import { IInterestHobbies } from "./interestHobbies.types";

// ✅ CREATE / UPDATE
export const createInterestHobbies = async (
  payload: IInterestHobbies
): Promise<IInterestHobbies> => {
  const { flowType } = payload;

  const data = await InterestHobbies.findOneAndUpdate(
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

// ✅ GET
export const getAllInterestHobbies = async (
  flowType?: string
): Promise<IInterestHobbies[]> => {
  if (flowType) {
    const data = await InterestHobbies.findOne({ flowType }).lean();
    return data ? [data] : [];
  }

  return InterestHobbies.find().lean();
};