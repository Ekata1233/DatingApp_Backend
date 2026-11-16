

import {
  Worker,
  Job,
} from "bullmq";

import {
  createBullMQRedisConnection,
} from "../config/bullmq";

import {
  MATCH_SCORE_QUEUE,
  MatchScoreJobData,
} from "../queues/match-score.queue";

import {
  getMatchScoresForUsers,
} from "../features/match-score/match-score.service";

const workerRedis =
  createBullMQRedisConnection();

export const matchScoreWorker =
  new Worker<MatchScoreJobData>(
    MATCH_SCORE_QUEUE,

    async (
      job: Job<MatchScoreJobData>,
    ) => {
      const { userId } =
        job.data;

      

      // await getMatchScoresForUsers(
      //   userId,
      //   userId
      // );

    

      return {
        userId,
      };
    },

    {
      connection: workerRedis,

      // Start lower while debugging
      concurrency: 2,
    },
  );

// ========================================
// WORKER EVENTS
// ========================================

matchScoreWorker.on(
  "ready",
  () => {
    
  },
);

matchScoreWorker.on(
  "active",
  (job) => {
    
  },
);

matchScoreWorker.on(
  "completed",
  (job) => {
 
  },
);

matchScoreWorker.on(
  "failed",
  (job, error) => {
    console.error(
      `❌ Worker failed job ${job?.id}:`,
      error.message,
    );
  },
);

let lastWorkerErrorLog = 0;

matchScoreWorker.on(
  "error",
  (error) => {
    const now = Date.now();

    // Prevent terminal spam
    if (
      now - lastWorkerErrorLog >
      30_000
    ) {
      console.error(
        "❌ Match score worker error:",
        error.message,
      );

      lastWorkerErrorLog = now;
    }
  },
);