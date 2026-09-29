// import {
//   VerificationStatus,
//   VerificationType,
// } from "@prisma/client";
// import crypto from "crypto";
// import { cleanupVerificationFiles, extractVerificationFrames } from "../../../utils/video-frame.util";
// import { prisma } from "../../../prisma/prismaClient";
// import { checkPassiveLiveness } from "../../../utils/gridlines-liveness";


// const VIDEO_VERIFICATION_POINTS = 5;

// // Gridlines docs suggest 0.5.
// // Keep it configurable so you can tune after testing.
// const LIVENESS_THRESHOLD = Number(
//   process.env.LIVENESS_THRESHOLD ?? 0.5
// );

// // Example business rule:
// // At least 2 out of 3 frames must pass.
// const MIN_PASSED_FRAMES = 2;

// interface VerifyVideoParams {
//   userId: string;
//   videoPath: string;
// }

// export const verifyVideoLivenessService = async ({
//   userId,
//   videoPath,
// }: VerifyVideoParams) => {
//   let frames: Awaited<
//     ReturnType<typeof extractVerificationFrames>
//   > = [];

//   try {
//     // -----------------------------------------
//     // 1. Check user
//     // -----------------------------------------

//     const user = await prisma.user.findUnique({
//       where: {
//         id: userId,
//       },
//       select: {
//         id: true,
//       },
//     });

//     if (!user) {
//       throw new Error("USER_NOT_FOUND");
//     }

//     // -----------------------------------------
//     // 2. Create/update VIDEO verification
//     // -----------------------------------------

//     const verification = await prisma.userVerification.upsert({
//       where: {
//         userId_type: {
//           userId,
//           type: VerificationType.VIDEO_VERIFICATION,
//         },
//       },

//       create: {
//         userId,
//         type: VerificationType.VIDEO_VERIFICATION,
//         status: VerificationStatus.IN_PROGRESS,
//         points: 0,
//         maxPoints: VIDEO_VERIFICATION_POINTS,
//         provider: "GRIDLINES",
//         startedAt: new Date(),
//       },

//       update: {
//         status: VerificationStatus.IN_PROGRESS,
//         points: 0,
//         provider: "GRIDLINES",
//         startedAt: new Date(),
//         verifiedAt: null,
//         rejectionReason: null,
//       },
//     });

//     // -----------------------------------------
//     // 3. Extract video frames
//     // -----------------------------------------

//     console.log("1. VIDEO SERVICE START");

//     console.time("FFMPEG_EXTRACTION");

//     frames = await extractVerificationFrames(videoPath);

//     console.timeEnd("FFMPEG_EXTRACTION");

//     console.log("2. FRAMES EXTRACTED:", frames.length);

//     for (let i = 0; i < frames.length; i++) {
//       console.log(`3. GRIDLINES FRAME ${i + 1} START`);

//       console.time(`GRIDLINES_${i + 1}`);

//       const result = await checkPassiveLiveness(
//         frames[i].base64,
//         crypto.randomUUID()
//       );

//       console.timeEnd(`GRIDLINES_${i + 1}`);

//       console.log(
//         `4. GRIDLINES FRAME ${i + 1} RESULT:`,
//         result
//       );
//     }

//     console.log("5. VIDEO SERVICE FINISHED");

//     if (frames.length === 0) {
//       throw new Error("NO_VIDEO_FRAMES_EXTRACTED");
//     }

//     // -----------------------------------------
//     // 4. Send frames to Gridlines
//     // -----------------------------------------

//     const results = [];

//     for (let i = 0; i < frames.length; i++) {
//       const referenceId = crypto.randomUUID();

//       try {
//         const result = await checkPassiveLiveness(
//           frames[i].base64,
//           referenceId
//         );

//         results.push({
//           frame: i + 1,
//           code: result.code,
//           message: result.message,
//           confidence: result.confidence,
//           transactionId: result.transactionId ?? null,

//           passed:
//             result.code === "1000" &&
//             result.confidence >= LIVENESS_THRESHOLD,
//         });
//       } catch (error: any) {
//         console.error(
//           `Liveness failed for frame ${i + 1}:`,
//           error?.response?.data || error
//         );

//         results.push({
//           frame: i + 1,
//           code:
//             error?.response?.data?.data?.code ??
//             "LIVENESS_API_ERROR",

//           message:
//             error?.response?.data?.data?.message ??
//             "Unable to verify frame",

//           confidence: 0,
//           transactionId: null,
//           passed: false,
//         });
//       }
//     }

//     // -----------------------------------------
//     // 5. Calculate result
//     // -----------------------------------------

//     const passedFrames = results.filter(
//       (result) => result.passed
//     );

//     const failedFrames = results.length - passedFrames.length;

//     const averageConfidence =
//       results.reduce(
//         (sum, result) => sum + result.confidence,
//         0
//       ) / results.length;

//     const highestConfidence = Math.max(
//       ...results.map((result) => result.confidence)
//     );

//     // At least 2 frames must pass.
//     const isLive =
//       passedFrames.length >= MIN_PASSED_FRAMES;

//     // -----------------------------------------
//     // 6. Reject
//     // -----------------------------------------

//     if (!isLive) {
//       await prisma.userVerification.update({
//         where: {
//           id: verification.id,
//         },

//         data: {
//           status: VerificationStatus.REJECTED,
//           points: 0,

//           rejectionReason:
//             "Liveness verification failed.",

//           metadata: {
//             threshold: LIVENESS_THRESHOLD,
//             totalFrames: results.length,
//             passedFrames: passedFrames.length,
//             failedFrames,
//             averageConfidence,
//             highestConfidence,
//             results,
//           },
//         },
//       });

//       return {
//         verified: false,

//         verificationId: verification.id,

//         status: VerificationStatus.REJECTED,

//         liveness: {
//           isLive: false,
//           threshold: LIVENESS_THRESHOLD,
//           totalFrames: results.length,
//           passedFrames: passedFrames.length,
//           averageConfidence,
//           highestConfidence,
//         },
//       };
//     }

//     // -----------------------------------------
//     // 7. VERIFIED
//     // -----------------------------------------

//     const verified =
//       await prisma.userVerification.update({
//         where: {
//           id: verification.id,
//         },

//         data: {
//           status: VerificationStatus.VERIFIED,

//           points: VIDEO_VERIFICATION_POINTS,

//           verifiedAt: new Date(),

//           rejectionReason: null,

//           metadata: {
//             threshold: LIVENESS_THRESHOLD,
//             totalFrames: results.length,
//             passedFrames: passedFrames.length,
//             failedFrames,
//             averageConfidence,
//             highestConfidence,
//             results,
//           },
//         },
//       });

//     return {
//       verified: true,

//       verificationId: verified.id,

//       status: verified.status,

//       points: verified.points,

//       liveness: {
//         isLive: true,
//         threshold: LIVENESS_THRESHOLD,
//         totalFrames: results.length,
//         passedFrames: passedFrames.length,
//         averageConfidence,
//         highestConfidence,
//       },
//     };
//   } finally {
//     // -----------------------------------------
//     // 8. Delete temporary files
//     // -----------------------------------------

//     await cleanupVerificationFiles(
//       videoPath,
//       frames
//     );
//   }
// };

import {
  VerificationStatus,
  VerificationType,
} from "@prisma/client";
import crypto from "crypto";

import {
  cleanupVerificationFiles,
  extractVerificationFrames,
} from "../../../utils/video-frame.util";

import { prisma } from "../../../prisma/prismaClient";

import { checkPassiveLiveness } from "../../../utils/gridlines-liveness";

// =====================================================
// CONFIGURATION
// =====================================================

const VIDEO_VERIFICATION_POINTS = 5;

/**
 * Gridlines documentation suggests 0.5.
 *
 * .env:
 * LIVENESS_THRESHOLD=0.5
 */
const LIVENESS_THRESHOLD = Number(
  process.env.LIVENESS_THRESHOLD ?? 0.5
);

/**
 * We extract 3 frames.
 * At least 2 frames must pass liveness.
 */
const MIN_PASSED_FRAMES = 2;

// =====================================================
// TYPES
// =====================================================

interface VerifyVideoParams {
  userId: string;
  videoPath: string;
}

// =====================================================
// SERVICE
// =====================================================

export const verifyVideoLivenessService = async ({
  userId,
  videoPath,
}: VerifyVideoParams) => {
  let frames: Awaited<
    ReturnType<typeof extractVerificationFrames>
  > = [];

  try {
    // =================================================
    // 1. CHECK USER
    // =================================================

    console.log("VIDEO VERIFICATION START:", {
      userId,
    });

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // =================================================
    // 2. CREATE / UPDATE VERIFICATION RECORD
    // =================================================

    const verification =
      await prisma.userVerification.upsert({
        where: {
          userId_type: {
            userId,
            type: VerificationType.VIDEO_VERIFICATION,
          },
        },

        create: {
          userId,

          type: VerificationType.VIDEO_VERIFICATION,

          status: VerificationStatus.IN_PROGRESS,

          points: 0,

          maxPoints: VIDEO_VERIFICATION_POINTS,

          provider: "GRIDLINES",

          startedAt: new Date(),
        },

        update: {
          status: VerificationStatus.IN_PROGRESS,

          points: 0,

          maxPoints: VIDEO_VERIFICATION_POINTS,

          provider: "GRIDLINES",

          startedAt: new Date(),

          verifiedAt: null,

          rejectionReason: null,
        },
      });

    console.log(
      "VERIFICATION RECORD:",
      verification.id
    );

    // =================================================
    // 3. EXTRACT VIDEO FRAMES
    // =================================================

    console.log("FFMPEG EXTRACTION START");

    console.time("FFMPEG_EXTRACTION");

    frames =
      await extractVerificationFrames(videoPath);

    console.timeEnd("FFMPEG_EXTRACTION");

    console.log(
      "FRAMES EXTRACTED:",
      frames.length
    );

    if (frames.length === 0) {
      throw new Error(
        "NO_VIDEO_FRAMES_EXTRACTED"
      );
    }

    // =================================================
    // 4. SEND FRAMES TO GRIDLINES
    // =================================================
    //
    // IMPORTANT:
    // Promise.all means all frames are checked
    // concurrently instead of:
    //
    // Frame 1 -> wait
    // Frame 2 -> wait
    // Frame 3 -> wait
    //
    // =================================================

    console.log(
      "GRIDLINES LIVENESS CHECK START"
    );

    console.time("GRIDLINES_TOTAL");

    const results = await Promise.all(
      frames.map(
        async (frame, index) => {
          const frameNumber = index + 1;

          const referenceId =
            crypto.randomUUID();

          console.log(
            `GRIDLINES FRAME ${frameNumber} START`
          );

          console.time(
            `GRIDLINES_FRAME_${frameNumber}`
          );

          try {
            const result =
              await checkPassiveLiveness(
                frame.base64,
                referenceId
              );

            console.log(
              `GRIDLINES FRAME ${frameNumber} RESULT:`,
              {
                code: result.code,
                message: result.message,
                confidence:
                  result.confidence,
                transactionId:
                  result.transactionId,
              }
            );

            /**
             * Gridlines:
             *
             * 1000 = Live
             * 1001 = Not Live
             *
             * We additionally verify that
             * confidence meets our threshold.
             */

            const passed =
              result.code === "1000" &&
              result.confidence >=
                LIVENESS_THRESHOLD;

            return {
              frame: frameNumber,

              referenceId,

              code: result.code,

              message: result.message,

              confidence:
                result.confidence,

              transactionId:
                result.transactionId ??
                null,

              passed,
            };
          } catch (error: any) {
            const providerError =
              error?.response?.data;

            console.error(
              `GRIDLINES FRAME ${frameNumber} ERROR:`,
              providerError ||
                error?.message ||
                error
            );

            return {
              frame: frameNumber,

              referenceId,

              code:
                providerError?.data
                  ?.code ??
                providerError?.code ??
                "LIVENESS_API_ERROR",

              message:
                providerError?.data
                  ?.message ??
                providerError?.message ??
                "Unable to verify frame",

              confidence: 0,

              transactionId:
                providerError
                  ?.transaction_id ??
                null,

              passed: false,
            };
          } finally {
            console.timeEnd(
              `GRIDLINES_FRAME_${frameNumber}`
            );
          }
        }
      )
    );

    console.timeEnd("GRIDLINES_TOTAL");

    console.log(
      "ALL GRIDLINES RESULTS:",
      results
    );

    // =================================================
    // 5. CALCULATE LIVENESS RESULT
    // =================================================

    const passedFrames =
      results.filter(
        (result) => result.passed
      );

    const failedFrames =
      results.length -
      passedFrames.length;

    const averageConfidence =
      results.length > 0
        ? results.reduce(
            (sum, result) =>
              sum +
              result.confidence,
            0
          ) / results.length
        : 0;

    const highestConfidence =
      results.length > 0
        ? Math.max(
            ...results.map(
              (result) =>
                result.confidence
            )
          )
        : 0;

    /**
     * Example:
     *
     * Frame 1 = PASS
     * Frame 2 = PASS
     * Frame 3 = FAIL
     *
     * passedFrames = 2
     *
     * MIN_PASSED_FRAMES = 2
     *
     * => Liveness PASSED
     */

    const isLive =
      passedFrames.length >=
      MIN_PASSED_FRAMES;

    console.log(
      "LIVENESS SUMMARY:",
      {
        totalFrames:
          results.length,

        passedFrames:
          passedFrames.length,

        failedFrames,

        averageConfidence,

        highestConfidence,

        threshold:
          LIVENESS_THRESHOLD,

        isLive,
      }
    );

    // =================================================
    // 6. LIVENESS FAILED
    // =================================================

    if (!isLive) {
      await prisma.userVerification.update({
        where: {
          id: verification.id,
        },

        data: {
          status:
            VerificationStatus.REJECTED,

          points: 0,

          verifiedAt: null,

          rejectionReason:
            "Liveness verification failed.",

          metadata: {
            method:
              "VIDEO_FRAME_PASSIVE_LIVENESS",

            provider:
              "GRIDLINES",

            threshold:
              LIVENESS_THRESHOLD,

            minimumPassedFrames:
              MIN_PASSED_FRAMES,

            totalFrames:
              results.length,

            passedFrames:
              passedFrames.length,

            failedFrames,

            averageConfidence,

            highestConfidence,

            results,
          },
        },
      });

      console.log(
        "VIDEO VERIFICATION REJECTED"
      );

      return {
        verified: false,

        verificationId:
          verification.id,

        status:
          VerificationStatus.REJECTED,

        points: 0,

        liveness: {
          isLive: false,

          threshold:
            LIVENESS_THRESHOLD,

          minimumPassedFrames:
            MIN_PASSED_FRAMES,

          totalFrames:
            results.length,

          passedFrames:
            passedFrames.length,

          failedFrames,

          averageConfidence,

          highestConfidence,

          frames: results,
        },
      };
    }

    // =================================================
    // 7. LIVENESS VERIFIED
    // =================================================

    const verified =
      await prisma.userVerification.update({
        where: {
          id: verification.id,
        },

        data: {
          status:
            VerificationStatus.VERIFIED,

          points:
            VIDEO_VERIFICATION_POINTS,

          verifiedAt: new Date(),

          rejectionReason: null,

          provider: "GRIDLINES",

          metadata: {
            method:
              "VIDEO_FRAME_PASSIVE_LIVENESS",

            provider:
              "GRIDLINES",

            threshold:
              LIVENESS_THRESHOLD,

            minimumPassedFrames:
              MIN_PASSED_FRAMES,

            totalFrames:
              results.length,

            passedFrames:
              passedFrames.length,

            failedFrames,

            averageConfidence,

            highestConfidence,

            results,
          },
        },
      });

    console.log(
      "VIDEO VERIFICATION VERIFIED:",
      verified.id
    );

    // =================================================
    // 8. RETURN SUCCESS
    // =================================================

    return {
      verified: true,

      verificationId:
        verified.id,

      status:
        verified.status,

      points:
        verified.points,

      liveness: {
        isLive: true,

        threshold:
          LIVENESS_THRESHOLD,

        minimumPassedFrames:
          MIN_PASSED_FRAMES,

        totalFrames:
          results.length,

        passedFrames:
          passedFrames.length,

        failedFrames,

        averageConfidence,

        highestConfidence,

        frames: results,
      },
    };
  } catch (error: any) {
    // =================================================
    // ERROR
    // =================================================

    console.error(
      "VIDEO VERIFICATION SERVICE ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw error;
  } finally {
    // =================================================
    // 9. CLEANUP
    // =================================================
    //
    // Always delete:
    //
    // - temporary video
    // - extracted JPG frames
    //
    // even when Gridlines throws an error.
    // =================================================

    console.log(
      "VIDEO VERIFICATION CLEANUP START"
    );

    try {
      await cleanupVerificationFiles(
        videoPath,
        frames
      );

      console.log(
        "VIDEO VERIFICATION CLEANUP COMPLETE"
      );
    } catch (cleanupError) {
      console.error(
        "VIDEO VERIFICATION CLEANUP ERROR:",
        cleanupError
      );
    }
  }
};