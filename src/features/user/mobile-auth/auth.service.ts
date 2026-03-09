import { twilioClient, verifyServiceSid } from "../../../config/twilio";
import { prisma } from "../../../prisma/prismaClient";
import jwt from "jsonwebtoken";

export const sendOtp = async (phoneNumber: string) => {
  const verification = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verifications.create({
      to: "+919272003735",
      channel: "sms",
    });

  return verification;
};

export const verifyOtp = async (phoneNumber: string, otp: string) => {
  const verificationCheck = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({
      to: "+919272003735",
      code: otp,
    });

  console.log("verificationCheck.status : ", verificationCheck.status);
  if (verificationCheck.status === "approved") {
    const user = await prisma.user.upsert({
      where: { phone_number: phoneNumber },
      update: {
        is_phone_verified: true,
      },
      create: {
        phone_number: phoneNumber,
        is_phone_verified: true,
      },
    });

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
