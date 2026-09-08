// import { gridlinesClient } from "../../utils/gridlines.client";

// export const sendAadhaarOtp = async (
//   userId: string,
//   aadhaarNumber: string
// ) => {
//   if (!/^\d{12}$/.test(aadhaarNumber)) {
//     throw new Error(
//       "Aadhaar number must contain 12 digits"
//     );
//   }

//   const referenceId =
//     crypto.randomUUID();

//   const response =
//     await gridlinesClient.post(
//       process.env
//         .GRIDLINES_AADHAAR_GENERATE_OTP_URL!,
//       {
//         aadhaar_number: aadhaarNumber,
//         consent: "Y",
//       },
//       {
//         headers: {
//           "X-Reference-ID": referenceId,
//         },
//       }
//     );

//   const transactionId =
//     response.data?.data?.transaction_id ??
//     response.data?.transaction_id;

//   if (!transactionId) {
//     throw new Error(
//       response.data?.message ||
//         "Unable to send Aadhaar OTP"
//     );
//   }

//   const verification =
//     await prisma.identityVerification.create({
//       data: {
//         userId,

//         method: "AADHAAR_OTP",

//         documentType: "AADHAAR",

//         status: "OTP_SENT",

//         transactionId,

//         requestId:
//           response.data?.request_id ?? null,

//         referenceId,
//       },
//     });

//   return {
//     verificationId:
//       verification.id,

//     transactionId,
//   };
// };

// export const verifyAadhaarOtp = async (
//   userId: string,
//   verificationId: string,
//   otp: string
// ) => {
//   const verification =
//     await prisma.identityVerification.findFirst({
//       where: {
//         id: verificationId,
//         userId,
//         method: "AADHAAR_OTP",
//         status: "OTP_SENT",
//       },
//     });

//   if (!verification) {
//     throw new Error(
//       "Aadhaar verification session not found"
//     );
//   }

//   if (!verification.transactionId) {
//     throw new Error(
//       "Transaction ID missing"
//     );
//   }

//   const response =
//     await gridlinesClient.post(
//       process.env
//         .GRIDLINES_AADHAAR_SUBMIT_OTP_URL!,
//       {
//         transaction_id:
//           verification.transactionId,

//         otp,

//         consent: "Y",
//       },
//       {
//         headers: {
//           "X-Reference-ID":
//             verification.referenceId ||
//             crypto.randomUUID(),
//         },
//       }
//     );

//   /*
//    * Adapt this according to the exact
//    * Gridlines Submit OTP response.
//    */
//   const aadhaarData =
//     response.data?.data;

//   if (!aadhaarData) {
//     throw new Error(
//       response.data?.message ||
//         "Aadhaar verification failed"
//     );
//   }

//   const user =
//     await prisma.user.findUnique({
//       where: {
//         id: userId,
//       },
//       select: {
//         full_name: true,
//         birth_date: true,
//       },
//     });

//   if (!user) {
//     throw new Error(
//       "User not found"
//     );
//   }

//   const aadhaarName =
//     aadhaarData.name ?? null;

//   const aadhaarDob =
//     aadhaarData.dob ?? null;

//   const nameMatched =
//     user.full_name &&
//     aadhaarName
//       ? normalizeName(
//           user.full_name
//         ) ===
//         normalizeName(
//           aadhaarName
//         )
//       : null;

//   let dobMatched: boolean | null =
//     null;

//   let ageVerified: boolean | null =
//     null;

//   if (aadhaarDob) {
//     const dob =
//       parseAadhaarDob(
//         aadhaarDob
//       );

//     if (dob) {
//       if (user.birth_date) {
//         dobMatched =
//           isSameDate(
//             user.birth_date,
//             dob
//           );
//       }

//       ageVerified =
//         calculateAge(dob) >= 18;
//     }
//   }

//   const updated =
//     await prisma.identityVerification.update({
//       where: {
//         id: verification.id,
//       },
//       data: {
//         status:
//           ageVerified === false
//             ? "FAILED"
//             : "VERIFIED",

//         nameMatched,

//         dobMatched,

//         ageVerified,

//         verifiedAt:
//           ageVerified === false
//             ? null
//             : new Date(),
//       },
//     });

//   return {
//     verificationId:
//       updated.id,

//     status:
//       updated.status,

//     nameMatched,
//     dobMatched,
//     ageVerified,
//   };
// };