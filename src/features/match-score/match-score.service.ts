

import {
  matchScoreRepository,
} from "./match-score.repository";

import {
  matchScoreCache,
} from "./match-score.cache";
import { calculateMatchScore } from "../../utils/matchScore.constants";

export const calculateUserMatchScores =
  async (userId: string) => {

    console.log(
      `🧮 Starting match calculation for ${userId}`,
    );

    // --------------------------------
    // 1. Get current user
    // --------------------------------

    const me =
      await matchScoreRepository
        .getUserForMatchScore(userId);

    if (!me) {
      throw new Error(
        `User not found: ${userId}`,
      );
    }

    // --------------------------------
    // 2. Get candidate IDs
    // --------------------------------

    const candidatesResult = await matchScoreRepository.getCandidates(userId);

    // FIX: Extract users array from the result
    const candidates = candidatesResult.users || [];

    console.log(`👥 Candidates: ${candidates.length}`);

    if (candidates.length === 0) {
      console.log(`No candidates found for user ${userId}`);
      return { success: true, matchesCalculated: 0 };
    }

    // --------------------------------
    // 3. Calculate each score
    // --------------------------------

    for (const candidate of candidates) {

      try {

        const user =
          await matchScoreRepository
            .getUserForMatchScore(
              candidate.id,
            );

        if (!user) {
          continue;
        }

        // --------------------------------
        // YOUR EXISTING FUNCTION
        // --------------------------------

        const result =
          calculateMatchScore(
            me,
            user,
          );

        console.log(
          `💯 ${userId} → ${candidate.id}`,
          result,
        );

        // --------------------------------
        // 4. PostgreSQL
        // --------------------------------

        await matchScoreRepository
          .upsertScore(
            userId,
            candidate.id,
            result.score,
            result.percentage,
          );

        // --------------------------------
        // 5. Redis
        // --------------------------------

        await matchScoreCache.set(
          userId,
          candidate.id,
          result.score,
          result.percentage,
        );

      } catch (error) {

        console.error(
          `❌ Failed for candidate ${candidate.id}`,
          error,
        );

      }
    }

    console.log(
      `✅ Match calculation completed for ${userId}`,
    );
  };