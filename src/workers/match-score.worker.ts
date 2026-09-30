console.log(
  "🚀 Match score worker file loaded",
);

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
  calculateUserMatchScores,
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

      console.log(
        "🔥 Processing match score job",
        {
          jobId: job.id,
          userId,
        },
      );

      await calculateUserMatchScores(
        userId,
      );

      console.log(
        "✅ Match score calculation completed",
        {
          jobId: job.id,
          userId,
        },
      );

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
    console.log(
      "🟢 Match score worker ready",
    );
  },
);

matchScoreWorker.on(
  "active",
  (job) => {
    console.log(
      "🟡 Match score worker picked job",
      {
        jobId: job.id,
        userId:
          job.data.userId,
      },
    );
  },
);

matchScoreWorker.on(
  "completed",
  (job) => {
    console.log(
      `✅ Worker completed job ${job.id}`,
    );
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