import IORedis from "ioredis";

export const createBullMQRedisConnection = () => {
  const redis = new IORedis(
    process.env.REDIS_URL!,
    {
      maxRetriesPerRequest: null,

      retryStrategy(times) {
        // 1s, 2s, 3s ... maximum 10 seconds
        return Math.min(times * 1000, 10000);
      },
    },
  );

  redis.on("ready", () => {
    console.log("✅ BullMQ Redis ready");
  });

  redis.on("close", () => {
    console.warn(
      "⚠️ BullMQ Redis connection closed",
    );
  });

  redis.on("reconnecting", (delay:number) => {
    console.warn(
      `🔄 BullMQ Redis reconnecting in ${delay}ms`,
    );
  });

  redis.on("error", (error) => {
    console.error(
      "❌ BullMQ Redis error:",
      error.message,
    );
  });

  return redis;
};