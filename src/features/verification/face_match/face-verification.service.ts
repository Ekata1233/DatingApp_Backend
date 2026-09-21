
// import {
//   VerificationStatus,
//   VerificationType,
// } from "@prisma/client";
// import { prisma } from "../../../prisma/prismaClient";


// import {
//   verifyFaceWithGridlines,
// } from "./face-match.provider";

// const FACE_POINTS = 5;

// export const verifyUserFaceService = async (
//   userId: string,
//   selfieBuffer: Buffer,
//   consent: boolean
// ) => {

//   // 1. Check consent
//   if (consent !== true) {
//     throw new Error("FACE_VERIFICATION_CONSENT_REQUIRED");
//   }

//   if (
//     !selfieBuffer ||
//     selfieBuffer.length === 0
//   ) {
//     throw new Error("SELFIE_REQUIRED");
//   }

//   // 2. Get Government ID verification
//   const governmentId =
//     await prisma.userVerification.findUnique({
//       where: {
//         userId_type: {
//           userId,
//           type: VerificationType.GOVERNMENT_ID,
//         },
//       },
//     });

//   if (!governmentId) {
//     throw new Error("GOVERNMENT_ID_VERIFICATION_REQUIRED");
//   }

//   if (
//     governmentId.status !==
//     VerificationStatus.VERIFIED
//   ) {
//     throw new Error("GOVERNMENT_ID_NOT_VERIFIED");
//   }

//   // 3. Check Government ID expiry
//   if (
//     governmentId.expiresAt &&
//     governmentId.expiresAt <= new Date()
//   ) {
//     throw new Error("GOVERNMENT_ID_VERIFICATION_EXPIRED");
//   }

//   // 4. Check Government ID portrait
//   if (!governmentId.governmentIdPhotoKey) {
//     throw new Error("GOVERNMENT_ID_PHOTO_NOT_AVAILABLE");
//   }

//   // 5. Check existing face verification
//   const existingFace =
//     await prisma.userVerification.findUnique({
//       where: {
//         userId_type: {
//           userId,
//           type: VerificationType.FACE_VERIFICATION,
//         },
//       },
//     });

//   if (
//     existingFace?.status ===
//     VerificationStatus.VERIFIED &&
//     (
//       !existingFace.expiresAt ||
//       existingFace.expiresAt > new Date()
//     )
//   ) {
//     return {
//       verificationId: existingFace.id,
//       status: "VERIFIED",
//       points: existingFace.points,
//       alreadyVerified: true,
//     };
//   }

//   if (
//     existingFace?.status ===
//     VerificationStatus.LOCKED
//   ) {
//     throw new Error("FACE_VERIFICATION_LOCKED");
//   }

//   // 6. Retrieve authenticated Government ID photo
//   const governmentPhoto =
//     await getGovernmentIdPhoto(
//       governmentId.governmentIdPhotoKey
//     );

//   if (
//     !governmentPhoto.buffer ||
//     governmentPhoto.buffer.length === 0
//   ) {
//     throw new Error("GOVERNMENT_ID_PHOTO_NOT_AVAILABLE");
//   }

//   // 7. Compare both images using Gridlines
//   const faceResult =
//     await verifyFaceWithGridlines(
//       governmentPhoto.buffer,
//       selfieBuffer
//     );

//   // 8. Determine verification result
//   const newStatus = faceResult.isMatch
//     ? VerificationStatus.VERIFIED
//     : VerificationStatus.REJECTED;

//   const points = faceResult.isMatch
//     ? FACE_POINTS
//     : 0;

//   const verifiedAt = faceResult.isMatch
//     ? new Date()
//     : null;

//   // 9. Save the verification result
//   const verification =
//     await prisma.userVerification.upsert({
//       where: {
//         userId_type: {
//           userId,
//           type: VerificationType.FACE_VERIFICATION,
//         },
//       },

//       create: {
//         userId,

//         type: VerificationType.FACE_VERIFICATION,

//         status: newStatus,

//         points,

//         maxPoints: FACE_POINTS,

//         provider: "GRIDLINES",

//         providerRef:
//           faceResult.providerRequestId,

//         startedAt: new Date(),

//         verifiedAt,

//         rejectionReason: faceResult.isMatch
//           ? null
//           : "FACE_NOT_MATCHED",

//         metadata: {
//           confidence: faceResult.confidence,
//           providerCode: faceResult.providerCode,
//           governmentIdType:
//             governmentId.governmentIdType,
//         },
//       },

//       update: {
//         status: newStatus,

//         points,

//         maxPoints: FACE_POINTS,

//         provider: "GRIDLINES",

//         providerRef:
//           faceResult.providerRequestId,

//         verifiedAt,

//         rejectionReason: faceResult.isMatch
//           ? null
//           : "FACE_NOT_MATCHED",

//         metadata: {
//           confidence: faceResult.confidence,
//           providerCode: faceResult.providerCode,
//           governmentIdType:
//             governmentId.governmentIdType,
//         },
//       },
//     });

//   // 10. Return result
//   return {
//     verificationId: verification.id,

//     type: verification.type,

//     status: verification.status,

//     points: verification.points,

//     maxPoints: verification.maxPoints,

//     isMatch: faceResult.isMatch,

//     confidence: faceResult.confidence,

//     message: faceResult.isMatch
//       ? "Face verification completed successfully"
//       : "Your selfie did not match your Government ID photo",
//   };
// };