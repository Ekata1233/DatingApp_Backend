// import { sendAadhaarOtp } from "./verification.service";

// export const sendAadhaarOtpController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const userId =
//       (req as any).user.id;

//     const {
//       aadhaarNumber,
//     } = req.body;

//     if (!aadhaarNumber) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Aadhaar number is required",
//       });
//     }

//     const result =
//       await sendAadhaarOtp(
//         userId,
//         aadhaarNumber
//       );

//     return res.status(200).json({
//       success: true,
//       message:
//         "OTP sent to Aadhaar-linked mobile number",
//       data: result,
//     });
//   } catch (error: any) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };