import { Worker, Job } from "bullmq";

import {
  bullmqRedis,
} from "../config/bullmq";

import {
  MATCH_SCORE_QUEUE,
  MatchScoreJobData,
} from "../queues/match-score.queue";

import {
  calculateUserMatchScores,
} from "../features/match-score/match-score.service";

export const matchScoreWorker =
  new Worker<MatchScoreJobData>(
    MATCH_SCORE_QUEUE,

    async (
      job: Job<MatchScoreJobData>,
    ) => {

      const { userId } =
        job.data;

      console.log(
        `🔥 Processing match score job`,
        {
          jobId: job.id,
          userId,
        },
      );

      await calculateUserMatchScores(
        userId,
      );

      console.log(
        `✅ Match score job completed`,
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
      connection: bullmqRedis,

      concurrency: 5,
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
      `❌ Worker failed job ${job?.id}`,
      error,
    );
  },
);

matchScoreWorker.on(
  "error",
  (error) => {
    console.error(
      "❌ Worker error:",
      error,
    );
  },
);