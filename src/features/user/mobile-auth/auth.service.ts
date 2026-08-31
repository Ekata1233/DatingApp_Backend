import { twilioClient, verifyServiceSid } from "../../../config/twilio";
import { prisma } from "../../../prisma/prismaClient";
import jwt from "jsonwebtoken";
import { setUserOnline } from "../../lastActivity/lastActivity.service";
import { generateReferralCode } from "../../../utils/referral";

export const sendOtp = async (phoneNumber: string) => {
  if (!phoneNumber) throw new Error("Phone number is required");

  const formattedNumber = phoneNumber.startsWith("+91")
    ? phoneNumber
    : `+91${phoneNumber}`;

  const account = await twilioClient.api
    .accounts(process.env.TWILIO_ACCOUNT_SID!)
    .fetch();

  const verification = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verifications.create({
      to: formattedNumber,
      channel: "sms",
    });

  return verification;
};

// Define user selection object once
const userSelect = {
  id: true,
  full_name: true,
  phone_number: true,
  email: true,
  birth_date: true,
  gender: true,
  gender_option: true,
  onboarding_completed: true,
  onboarding_step: true,
  profile_completion: true,
  referralCode: true,
  created_at: true,
  profile: {
    select: {
      country: true,
      state: true,
      city: true,
    },
  },
};

export const verifyOtp = async (phoneNumber: string, otp: string, referralCode?: string) => {
  // Input validation
  if (!phoneNumber || !otp) {
    throw new Error("Phone & OTP required");
  }

  // Format phone number consistently
  const formattedNumber = phoneNumber.startsWith("+91")
    ? phoneNumber
    : `+91${phoneNumber}`;

  // Verify OTP with Twilio
  const verificationCheck = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({
      to: formattedNumber,
      code: otp,
    });

  if (verificationCheck.status !== "approved") {
    throw new Error("Invalid OTP");
  }

  let isRegister = false;

  // Transaction starts here
  const result = await prisma.$transaction(async (tx) => {
    // Check if user already exists
    const existingUser = await tx.user.findUnique({
      where: {
        phone_number: formattedNumber,
      },
    });

    // ─── EXISTING USER FLOW ────────────────────────────────────
    if (existingUser) {
      isRegister = true;
      // Update existing user's phone verification
      await tx.user.update({
        where: { id: existingUser.id },
        data: { is_phone_verified: true },
      });

      // Fetch user data with profile
      const userData = await tx.user.findUnique({
        where: { id: existingUser.id },
        select: userSelect,
      });

      return userData;
    }

    // ─── NEW USER FLOW ────────────────────────────────────────

    // Step 1: Validate referral code (if provided)
    let referrer: { id: string; } | null = null;

    if (referralCode) {
      const normalizedReferralCode = referralCode.trim().toUpperCase();
      referrer = await tx.user.findFirst({
        where: {
          referralCode: normalizedReferralCode,
          deleted_at: null,
        },
        select: {
          id: true,
        },
      });

      if (!referrer) {
        throw new Error("Invalid referral code.");
      }
    }

    // Step 2: Generate referral code for new user
    const myReferralCode = await generateReferralCode(tx);

    // Step 3: Create user
    const newUser = await tx.user.create({
      data: {
        phone_number: formattedNumber,
        is_phone_verified: true,
        referralCode: myReferralCode,
      },
    });

    // Step 4-7: Initialize wallet, stats, and balances in parallel
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await Promise.all([
      // Initialize wallet
      tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
        },
      }),
      // Initialize DatePlanUserStats
      tx.datePlanUserStats.create({
        data: {
          userId: newUser.id,
          totalDatePlan: 0,
          balance: 0,
          purchasedDataPlan: 0,
          weeklyLimit: 0, // Configure as per your business logic
          totalDetePlanUsed: 0,
          lastResetAt: now,
          nextResetAt: nextWeek,
        },
      }),
      // Initialize UserRoseBalance
      tx.userRoseBalance.create({
        data: {
          userId: newUser.id,
          totalRoses: 0,
          freeRoses: 0,
          purchasedRoses: 0,
          weeklyLimit: 0, // Configure as per your business logic
          totalRosesSent: 0,
          lastResetAt: now,
          nextResetAt: nextWeek,
        },
      }),
      // Initialize UserComplimentBalance
      tx.userComplimentBalance.create({
        data: {
          userId: newUser.id,
          totalCompliments: 0,
          freeCompliments: 0,
          purchasedCompliments: 0,
          weeklyLimit: 0, // Configure as per your business logic
          totalComplimentsSent: 0,
          lastResetAt: now,
          nextResetAt: nextWeek,
        },
      }),
      // Initialize UserBoost
      tx.userBoost.create({
        data: {
          user_id: newUser.id,
          total_boosts: 0,
          remaining_boosts: 0,
          weeklyLimit: 0, // Configure as per your business logic
          last_reset_at: now,
          next_reset_at: nextWeek,
          start_at: now,
          is_active: true,
        },
      }),
    ]);

    // Step 8: Create referral relationship (if referrer exists)
    if (referrer) {
      // Prevent self-referral
      if (referrer.id === newUser.id) {
        throw new Error("You cannot use your own referral code.");
      }

      // Check if already referred
      const alreadyReferred = await tx.userReferral.findUnique({
        where: { referredUserId: newUser.id },
      });

      if (alreadyReferred) {
        throw new Error("Referral code has already been applied.");
      }

      // Prevent referral loop
      const reverseReferral = await tx.userReferral.findFirst({
        where: {
          referrerId: newUser.id,
          referredUserId: referrer.id,
        },
      });

      if (reverseReferral) {
        throw new Error(
          "Referral cannot be applied because you have already referred this user."
        );
      }

      // Create referral
      await tx.userReferral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: newUser.id,
          status: "PENDING",
        },
      });

      // Update referrer's stats
      await tx.userReferralStats.upsert({
        where: { userId: referrer.id },
        update: {
          totalInvites: { increment: 1 },
          pendingRewards: { increment: 1 },
        },
        create: {
          userId: referrer.id,
          totalInvites: 1,
          pendingRewards: 1,
        },
      });
    }

    // Step 9: Fetch complete user profile
    const userData = await tx.user.findUnique({
      where: { id: newUser.id },
      select: userSelect,
    });

    return userData;
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: result!.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return {
    user: result,
    token,
    is_register: isRegister,
  };
};

















































//----------------------------MSG 91----------------------------------------------------------------------------------
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