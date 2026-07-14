import { redis } from "../../../../lib/redis";
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

  // Different cache key for each query
  const cacheKey = flowType
    ? `lifestyle:${flowType}`
    : "lifestyle:all";

  // 1. Check Redis
  const cachedData = await redis.get<ILifestyle[]>(cacheKey);

  if (cachedData) {
    console.log(`✅ Cache Hit: ${cacheKey}`);
    return cachedData;
  }

  console.log(`📦 Cache Miss: ${cacheKey}`);

  // 2. Fetch from MongoDB
  let data: ILifestyle[];

  if (flowType) {
    const lifestyle = await Lifestyle.findOne({ flowType }).lean();
    data = lifestyle ? [lifestyle] : [];
  } else {
    data = await Lifestyle.find().lean();
  }

  // 3. Store in Redis for 10 minutes
  await redis.set(cacheKey, data, {
    ex: 600, // 10 minutes
  });

  return data;
};

// export const deleteLifestyle = async (): Promise<void> => {
//   await Lifestyle.deleteMany({});
// };
