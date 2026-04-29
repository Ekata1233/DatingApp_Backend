import { twilioClient, verifyServiceSid } from "../../../config/twilio";
import { prisma } from "../../../prisma/prismaClient";
import jwt from "jsonwebtoken";
import { setUserOnline } from "../../lastActivity/lastActivity.service";

export const sendOtp = async (phoneNumber: string) => {
  if (!phoneNumber) throw new Error("Phone number is required");

  const formattedNumber = phoneNumber.startsWith("+91")
    ? phoneNumber
    : `+91${phoneNumber}`;

  const verification = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verifications.create({
      to: formattedNumber,
      channel: "sms",
    });

  return verification;
};

export const verifyOtp = async (phoneNumber: string, otp: string) => {
   if (!phoneNumber || !otp) throw new Error("Phone & OTP required");

  const formattedNumber = phoneNumber.startsWith("+91")
    ? phoneNumber
    : `+91${phoneNumber}`;

    console.log("Verifying OTP for: ", formattedNumber);

  const verificationCheck = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({
      to: formattedNumber,
      code: otp,
    });

console.log("Twilio Response:", JSON.stringify(verificationCheck, null, 2));
  console.log("verificationCheck.status : ", verificationCheck.status);

  if (verificationCheck.status === "approved") {
    const user = await prisma.user.upsert({
      where: { phone_number: formattedNumber },
      update: {
        is_phone_verified: true,
      },
      create: {
        phone_number: formattedNumber,
        is_phone_verified: true,
      },
    });

    //Last seen & online status will be handled by presence system, so no need to set it here
    // await setUserOnline(user.id);
    //end of presence handling
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    return {
      user,
      token,
    };
  }

  throw new Error("Invalid OTP");
};


// import axios from "axios";
// import { prisma } from "../../../prisma/prismaClient";
// import jwt from "jsonwebtoken";
// import { MSG91_AUTH_KEY, MSG91_TEMPLATE_ID } from "../../../config/msg91";

// export const sendOtp = async (phoneNumber: string) => {
//   const response = await axios.post(
//     "https://control.msg91.com/api/v5/otp",
//     {
//       template_id: MSG91_TEMPLATE_ID,
//       mobile: `91${phoneNumber}`,
//     },
//     {
//       headers: {
//         authkey: MSG91_AUTH_KEY,
//       },
//     }
//   );

//   console.log("OTP Response: ", response.data);

//   return response.data;
// };

// export const verifyOtp = async (phoneNumber: string, otp: string) => {
//   const response = await axios.get(
//     `https://control.msg91.com/api/v5/otp/verify`,
//     {
//       params: {
//         mobile: `91${phoneNumber}`,
//         otp: otp,
//       },
//       headers: {
//         authkey: MSG91_AUTH_KEY,
//       },
//     }
//   );

//   const data = response.data;

//   if (data.type === "success") {
//     const user = await prisma.user.upsert({
//       where: { phone_number: phoneNumber },
//       update: {
//         is_phone_verified: true,
//       },
//       create: {
//         phone_number: phoneNumber,
//         is_phone_verified: true,
//       },
//     });

//     const token = jwt.sign(
//       { userId: user.id },
//       process.env.JWT_SECRET as string,
//       { expiresIn: "7d" }
//     );

//     return {
//       user,
//       token,
//     };
//   }

//   throw new Error("Invalid OTP");
// };