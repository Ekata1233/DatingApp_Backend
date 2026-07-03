import { SexualOrientation } from "./sexualorientations.model";
import { ISexualOrientation } from "./sexualorientations.types";

// ✅ CREATE / UPDATE (flowType आधारित upsert)
export const createSexualOrientation = async (
  payload: ISexualOrientation
): Promise<ISexualOrientation> => {
  const { flowType } = payload;

  const data = await SexualOrientation.findOneAndUpdate(
    { flowType },          // ✅ same flowType find
    payload,               // ✅ update पूरे document से
    {
      new: true,           // ✅ updated document return
      upsert: true,        // ✅ create if not exists
      runValidators: true, // ✅ schema validation
    }
  );

  return data;
};

// ✅ GET ALL (flowType optional filter)
export const getAllSexualOrientation = async (
  flowType?: string
): Promise<ISexualOrientation[]> => {
  const filter: any = {};

  if (flowType) {
    filter.flowType = flowType; // ✅ filter by flowType
  }

  return SexualOrientation.find(filter).lean();
};

// ✅ DELETE (ALL)
export const deleteSexualOrientation = async (): Promise<void> => {
  await SexualOrientation.deleteMany({});
};