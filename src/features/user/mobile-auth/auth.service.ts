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


  if (verificationCheck.status !== "approved") {
    throw new Error("Invalid OTP");
  }

  // Transaction starts here
  const user = await prisma.$transaction(async (tx) => {
    // Create user if doesn't exist
    const user = await tx.user.upsert({
      where: {
        phone_number: formattedNumber,
      },
      update: {
        is_phone_verified: true,
      },
      create: {
        phone_number: formattedNumber,
        is_phone_verified: true,
      },
    });

    // Create wallet only if it doesn't exist
    await tx.wallet.upsert({
      where: {
        userId: user.id,
      },
      update: {}, // Nothing to update
      create: {
        userId: user.id,
        balance: 0,
      },
    });

    // Create Date Plan Stats only if it doesn't exist
    await tx.datePlanUserStats.upsert({
      where: {
        userId: user.id,
      },
      update: {},
      create: {
        userId: user.id,
        balance: 0, // Optional since your schema has @default(0)
      },
    });

    return user;
  });

  //LAST SEEEN AND ONLINE PRESENCE HANDLING
  // await setUserOnline(user.id);
  //end of presence handling

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  );

  return {
    user,
    token,
  };
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