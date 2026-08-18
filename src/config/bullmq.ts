import IORedis from "ioredis";

export const bullmqRedis = new IORedis(
  process.env.REDIS_URL!,
  {
    maxRetriesPerRequest: null,
  },
);

bullmqRedis.on("connect", () => {
  console.log("✅ BullMQ Redis connected");
});

bullmqRedis.on("error", (error) => {
  console.error("❌ BullMQ Redis error:", error);
});