import { twilioClient, verifyServiceSid } from "../../../config/twilio";
import { prisma } from "../../../prisma/prismaClient";

export const sendOtp = async (phoneNumber: string) => {
  const verification = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verifications.create({
      to: '+919272003735',
      channel: "sms",
    });

  return verification;
};

export const verifyOtp = async (phoneNumber: string, otp: string) => {
  const verificationCheck = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({
      to: '+919272003735',
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

    return user;
  }

  throw new Error("Invalid OTP");
};