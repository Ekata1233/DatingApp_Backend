

// import {
//   matchScoreRepository,
// } from "./match-score.repository";

// import {
//   matchScoreCache,
// } from "./match-score.cache";
// import { calculateMatchScore } from "../../utils/matchScore.constants";

// export const calculateUserMatchScores = async (userId: string) => {

//   console.log(
//     `🧮 Starting match calculation for ${userId}`,
//   );

//   // --------------------------------
//   // 1. Get current user
//   // --------------------------------

//   const me =
//     await matchScoreRepository
//       .getUserForMatchScore(userId);

//   if (!me) {
//     throw new Error(
//       `User not found: ${userId}`,
//     );
//   }

//   // --------------------------------
//   // 2. Get candidate IDs
//   // --------------------------------

//   const candidatesResult = await matchScoreRepository.getCandidates(userId);

//   // FIX: Extract users array from the result
//   const candidates = candidatesResult.users || [];

//   console.log(`👥 Candidates: ${candidates.length}`);

//   if (candidates.length === 0) {
//     console.log(`No candidates found for user ${userId}`);
//     return { success: true, matchesCalculated: 0 };
//   }

//   // --------------------------------
//   // 3. Calculate each score
//   // --------------------------------

//   for (const candidate of candidates) {

//     try {

//       const user =
//         await matchScoreRepository
//           .getUserForMatchScore(
//             candidate.id,
//           );

//       if (!user) {
//         continue;
//       }

//       // --------------------------------
//       // YOUR EXISTING FUNCTION
//       // --------------------------------

//       const result =
//         calculateMatchScore(
//           me,
//           user,
//         );

//       console.log(
//         `💯 ${userId} → ${candidate.id}`,
//         result,
//       );

//       // --------------------------------
//       // 4. PostgreSQL
//       // --------------------------------

//       await matchScoreRepository
//         .upsertScore(
//           userId,
//           candidate.id,
//           result.score,
//           result.percentage,
//         );

//       // --------------------------------
//       // 5. Redis
//       // --------------------------------

//       await matchScoreCache.set(
//         userId,
//         candidate.id,
//         result.score,
//         result.percentage,
//       );

//     } catch (error) {

//       console.error(
//         `❌ Failed for candidate ${candidate.id}`,
//         error,
//       );

//     }
//   }

//   console.log(
//     `✅ Match calculation completed for ${userId}`,
//   );
// };  


import {
  matchScoreRepository,
} from "./match-score.repository";

import {
  matchScoreCache,
  CachedMatchScore,
} from "./match-score.cache";

import {
  calculateMatchScore,
} from "../../utils/matchScore.constants";

export const getMatchScoresForUsers = async (
  userId: string,
  candidateIds: string[],
): Promise<Map<string, CachedMatchScore>> => {
  const result = new Map<string, CachedMatchScore>();

  const uniqueCandidateIds = [
    ...new Set(
      candidateIds.filter((id) => id && id !== userId),
    ),
  ];

  if (uniqueCandidateIds.length === 0) {
    return result;
  }

  // ---------------------------------------
  // 1. Get profile versions
  // ---------------------------------------
  const allUserIds = [
    userId,
    ...uniqueCandidateIds,
  ];

  const versions =
    await matchScoreCache.getVersions(allUserIds);

  // ---------------------------------------
  // 2. Read cached scores in bulk
  // ---------------------------------------
  const cachedScores =
    await matchScoreCache.getMany(
      userId,
      uniqueCandidateIds,
      versions,
    );

  for (const [id, value] of cachedScores) {
    result.set(id, value);
  }

  // ---------------------------------------
  // 3. Identify cache misses
  // ---------------------------------------
  const missingIds = uniqueCandidateIds.filter(
    (id) => !cachedScores.has(id),
  );

  if (missingIds.length === 0) {
    return result;
  }

  // ---------------------------------------
  // 4. Fetch only missing scoring profiles
  // ---------------------------------------
  const users =
    await matchScoreRepository.getUsersForMatchScore([
      userId,
      ...missingIds,
    ]);

  const usersMap = new Map(
    users.map((user) => [user.id, user]),
  );

  const me = usersMap.get(userId);

  if (!me) {
    throw new Error(
      "Current user not found for match calculation",
    );
  }

  // ---------------------------------------
  // 5. Calculate scores in memory
  // ---------------------------------------
  const calculatedScores =
    new Map<string, CachedMatchScore>();

  for (const candidateId of missingIds) {
    const candidate = usersMap.get(candidateId);

    if (!candidate) {
      continue;
    }

    const match = calculateMatchScore(
      me,
      candidate,
    );

    const value: CachedMatchScore = {
      score: match.score,
      percentage: match.percentage,
    };

    result.set(candidateId, value);
    calculatedScores.set(candidateId, value);
  }

  // ---------------------------------------
  // 6. Cache newly calculated scores
  // ---------------------------------------
  // Recheck versions to avoid caching a score
  // under a newer profile version if a profile
  // changed during the calculation.
  if (calculatedScores.size > 0) {
    const latestVersions =
      await matchScoreCache.getVersions(allUserIds);

    const safeScores =
      new Map<string, CachedMatchScore>();

    for (const [candidateId, value] of calculatedScores) {
      if (
        latestVersions.get(userId) === versions.get(userId) &&
        latestVersions.get(candidateId) ===
          versions.get(candidateId)
      ) {
        safeScores.set(candidateId, value);
      }
    }

    await matchScoreCache.setMany(
      userId,
      safeScores,
      versions,
    );
  }

  return result;
};
