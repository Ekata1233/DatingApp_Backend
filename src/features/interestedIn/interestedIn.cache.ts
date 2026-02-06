import { redis } from "../../config/redis";
import { IInterestedIn } from "./interestedIn.types";

const CACHE_KEY = "interestedIn:all";
const TTL = 60 * 5; // 5 minutes

export const getInterestedInCache = async (): Promise<IInterestedIn[] | null> => {
  const data = await redis.get(CACHE_KEY);
  return data ? JSON.parse(data) : null;
};

export const setInterestedInCache = async (
  data: IInterestedIn[]
): Promise<void> => {
  await redis.set(CACHE_KEY, JSON.stringify(data), "EX", TTL);
};

export const clearInterestedInCache = async (): Promise<void> => {
  await redis.del(CACHE_KEY);
};
