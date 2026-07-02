import { Education } from "./education.model";
import { IEducation } from "./education.types";

// ✅ CREATE / UPDATE (one per flowType)
export const createEducation = async (
  payload: IEducation
): Promise<IEducation> => {
  const { flowType } = payload;

  const data = await Education.findOneAndUpdate(
    { flowType }, // ✅ only flowType
    payload,
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return data;
};

// ✅ GET (single per flowType)
export const getAllEducation = async (
  flowType?: string
): Promise<IEducation[]> => {
  if (flowType) {
    const data = await Education.findOne({ flowType }).lean();
    return data ? [data] : [];
  }

  return Education.find().lean();
};