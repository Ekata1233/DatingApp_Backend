import { Queue } from "bullmq";
import { bullmqRedis } from "../config/bullmq";

export interface MatchScoreJobData {
  userId: string;
}

export const MATCH_SCORE_QUEUE = "match-score";

export const matchScoreQueue =
  new Queue<MatchScoreJobData>(
    MATCH_SCORE_QUEUE,
    {
      connection: bullmqRedis,

      defaultJobOptions: {
        attempts: 3,

        backoff: {
          type: "exponential",
          delay: 2000,
        },

        removeOnComplete: {
          age: 3600,
          count: 1000,
        },

        removeOnFail: {
          age: 24 * 60 * 60,
        },
      },
    },
  );

export const queueMatchScoreCalculation = async (
  userId: string,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  console.log("before match score queue")
  await matchScoreQueue.add(
    "calculate-user-match-scores",
    {
      userId,
    },
    {
      jobId: `match-score-${userId}`,
    },
  );

  console.log(
    `📌 Match score job queued for ${userId}`,
  );
};