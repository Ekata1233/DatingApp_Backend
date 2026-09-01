// import https from "https";

// export const sendOtp = async ({
//   phoneNumber,
// }: {
//   phoneNumber: string;
// }) => {
//   return new Promise((resolve, reject) => {
//     const options = {
//       method: "POST",
//       hostname: "control.msg91.com",
//       path: "/api/v5/otp",
//       headers: {
//         authkey: process.env.MSG91_AUTH_KEY!,
//         "Content-Type": "application/json",
//       },
//     };

//     const req = https.request(options, (res) => {
//       let data = "";

//       res.on("data", (chunk) => {
//         data += chunk;
//       });

//       res.on("end", () => {
//         console.log("MSG91 Status:", res.statusCode);
//         console.log("MSG91 Response:", data);

//         try {
//           resolve(JSON.parse(data));
//         } catch {
//           resolve(data);
//         }
//       });
//     });

//     req.on("error", (error) => {
//       reject(error);
//     });

//     req.write(
//       JSON.stringify({
//         template_id: process.env.MSG91_TEMPLATE_ID,
//         mobile: `91${phoneNumber}`,
//         otp_length: 6,
//         otp_expiry: 10,
//       }),
//     );

//     req.end();
//   });
// };

// interface VerifyOtpParams {
//   phoneNumber: string;
//   otp: string;
// }

// export const verifyOtp = ({
//   phoneNumber,
//   otp,
// }: VerifyOtpParams): Promise<any> => {
//   return new Promise((resolve, reject) => {
//     const authKey = process.env.MSG91_AUTH_KEY;

//     if (!authKey) {
//       return reject(
//         new Error("MSG91 auth key is not configured"),
//       );
//     }

//     // Add India country code
//     const mobile = `91${phoneNumber}`;

//     const path =
//       `/api/v5/otp/verify` +
//       `?otp=${encodeURIComponent(otp)}` +
//       `&mobile=${encodeURIComponent(mobile)}`;

//     const options = {
//       method: "GET",
//       hostname: "control.msg91.com",
//       path,
//       headers: {
//         authkey: authKey,
//       },
//     };

//     const req = https.request(options, (res) => {
//       const chunks: Buffer[] = [];

//       res.on("data", (chunk) => {
//         chunks.push(chunk);
//       });

//       res.on("end", () => {
//         const body = Buffer.concat(chunks).toString();

//         try {
//           const data = JSON.parse(body);

//           if (res.statusCode && res.statusCode >= 400) {
//             return reject(data);
//           }

//           resolve(data);
//         } catch {
//           resolve(body);
//         }
//       });
//     });

//     req.on("error", (error) => {
//       reject(error);
//     });

//     req.end();
//   });
// };


import https from "https";
import jwt from "jsonwebtoken";
import { prisma } from "../../../prisma/prismaClient";
import { generateReferralCode } from "../../../utils/referral";

/* =========================================================
   MSG91 SEND OTP
========================================================= */

export const sendOtp = async ({
  phoneNumber,
}: {
  phoneNumber: string;
}) => {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey) {
    throw new Error("MSG91 auth key is not configured");
  }

  if (!templateId) {
    throw new Error("MSG91 template ID is not configured");
  }

  // Remove spaces, +91 and any non-numeric characters
  const cleanedPhone = phoneNumber
    .replace(/\s+/g, "")
    .replace(/^\+91/, "")
    .replace(/^91/, "");

  if (!/^\d{10}$/.test(cleanedPhone)) {
    throw new Error("Invalid Indian phone number");
  }

  const mobile = `91${cleanedPhone}`;

  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      hostname: "control.msg91.com",
      path: "/api/v5/otp",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log("MSG91 Send OTP Status:", res.statusCode);
        console.log("MSG91 Send OTP Response:", data);

        try {
          const parsedData = JSON.parse(data);

          if (res.statusCode && res.statusCode >= 400) {
            return reject(parsedData);
          }

          resolve(parsedData);
        } catch {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(data));
          }

          resolve(data);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(
      JSON.stringify({
        template_id: templateId,
        mobile,
        otp_length: 6,
        otp_expiry: 10,
      }),
    );

    req.end();
  });
};


/* =========================================================
   MSG91 VERIFY OTP
========================================================= */

interface VerifyOtpParams {
  phoneNumber: string;
  otp: string;
  referralCode?: string;
}

export const verifyOtp = ({
  phoneNumber,
  otp,
  referralCode,
}: VerifyOtpParams): Promise<any> => {
  return new Promise((resolve, reject) => {
    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      return reject(
        new Error("MSG91 auth key is not configured"),
      );
    }

    if (!phoneNumber || !otp) {
      return reject(
        new Error("Phone & OTP required"),
      );
    }

    /*
     * Normalize phone number
     */
    const cleanedPhone = phoneNumber
      .replace(/\s+/g, "")
      .replace(/^\+91/, "")
      .replace(/^91/, "");

    if (!/^\d{10}$/.test(cleanedPhone)) {
      return reject(
        new Error("Invalid Indian phone number"),
      );
    }

    const mobile = `91${cleanedPhone}`;

    /*
     * MSG91 OTP verification API
     */
    const path =
      `/api/v5/otp/verify` +
      `?otp=${encodeURIComponent(otp)}` +
      `&mobile=${encodeURIComponent(mobile)}`;

    const options = {
      method: "GET",
      hostname: "control.msg91.com",
      path,
      headers: {
        authkey: authKey,
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", async () => {
        const body = Buffer.concat(chunks).toString();

        try {
          const msg91Response = JSON.parse(body);

          console.log(
            "MSG91 Verify OTP Status:",
            res.statusCode,
          );

          console.log(
            "MSG91 Verify OTP Response:",
            msg91Response,
          );

          /*
           * MSG91 API error
           */
          if (res.statusCode && res.statusCode >= 400) {
            return reject(
              new Error(
                msg91Response?.message ||
                  "OTP verification failed",
              ),
            );
          }

          /*
           * MSG91 normally returns:
           *
           * {
           *   "type": "success",
           *   "message": "OTP verified successfully"
           * }
           */

          if (msg91Response?.type !== "success") {
            return reject(
              new Error(
                msg91Response?.message ||
                  "Invalid OTP",
              ),
            );
          }

          /*
           * OTP is verified successfully.
           *
           * Now execute the complete application
           * authentication / registration flow.
           */
          try {
            const result = await handleVerifiedUser({
              phoneNumber: cleanedPhone,
              referralCode,
            });

            resolve(result);
          } catch (error) {
            reject(error);
          }
        } catch {
          reject(
            new Error(
              "Invalid response from MSG91",
            ),
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
};


/* =========================================================
   USER SELECTION
========================================================= */

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


/* =========================================================
   AFTER OTP VERIFIED
========================================================= */

const handleVerifiedUser = async ({
  phoneNumber,
  referralCode,
}: {
  phoneNumber: string;
  referralCode?: string;
}) => {
  let isRegister = false;

  /*
   * Store phone consistently.
   *
   * Example:
   * +919876543210
   */
  const formattedNumber = `+91${phoneNumber}`;

  const result = await prisma.$transaction(
    async (tx) => {
      /*
       * =====================================================
       * EXISTING USER
       * =====================================================
       */

      const existingUser = await tx.user.findUnique({
        where: {
          phone_number: formattedNumber,
        },
      });

      if (existingUser) {
        /*
         * IMPORTANT:
         *
         * Existing user means this is NOT registration.
         *
         * If your frontend currently expects true here,
         * keep your old behavior. Otherwise false is correct.
         */
        isRegister = false;

        /*
         * Mark phone as verified
         */
        await tx.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            is_phone_verified: true,
          },
        });

        /*
         * Fetch user with profile
         */
        const userData = await tx.user.findUnique({
          where: {
            id: existingUser.id,
          },
          select: userSelect,
        });

        return userData;
      }


      /*
       * =====================================================
       * NEW USER
       * =====================================================
       */

      isRegister = true;


      /*
       * =====================================================
       * REFERRAL VALIDATION
       * =====================================================
       */

      let referrer: {
        id: string;
      } | null = null;

      if (referralCode) {
        const normalizedReferralCode =
          referralCode.trim().toUpperCase();

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
          throw new Error(
            "Invalid referral code.",
          );
        }
      }


      /*
       * =====================================================
       * GENERATE NEW USER REFERRAL CODE
       * =====================================================
       */

      const myReferralCode =
        await generateReferralCode(tx);


      /*
       * =====================================================
       * CREATE USER
       * =====================================================
       */

      const newUser = await tx.user.create({
        data: {
          phone_number: formattedNumber,
          is_phone_verified: true,
          referralCode: myReferralCode,
        },
      });


      /*
       * =====================================================
       * INITIALIZE BALANCES / STATS
       * =====================================================
       */

      const now = new Date();

      const nextWeek = new Date(now);

      nextWeek.setDate(
        nextWeek.getDate() + 7,
      );


      /*
       * Create all initial records
       *
       * NOTE:
       * Prisma interactive transactions should ideally
       * avoid Promise.all for dependent transaction
       * operations. Sequential operations are safer.
       */

      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
        },
      });


      await tx.datePlanUserStats.create({
        data: {
          userId: newUser.id,
          totalDatePlan: 0,
          balance: 0,
          purchasedDataPlan: 0,
          weeklyLimit: 0,
          totalDetePlanUsed: 0,
          lastResetAt: now,
          nextResetAt: nextWeek,
        },
      });


      await tx.userRoseBalance.create({
        data: {
          userId: newUser.id,
          totalRoses: 0,
          freeRoses: 0,
          purchasedRoses: 0,
          weeklyLimit: 0,
          totalRosesSent: 0,
          lastResetAt: now,
          nextResetAt: nextWeek,
        },
      });


      await tx.userComplimentBalance.create({
        data: {
          userId: newUser.id,
          totalCompliments: 0,
          freeCompliments: 0,
          purchasedCompliments: 0,
          weeklyLimit: 0,
          totalComplimentsSent: 0,
          lastResetAt: now,
          nextResetAt: nextWeek,
        },
      });


      await tx.userBoost.create({
        data: {
          user_id: newUser.id,
          total_boosts: 0,
          remaining_boosts: 0,
          weeklyLimit: 0,
          last_reset_at: now,
          next_reset_at: nextWeek,
          start_at: now,
          is_active: true,
        },
      });


      /*
       * =====================================================
       * REFERRAL RELATIONSHIP
       * =====================================================
       */

      if (referrer) {

        /*
         * Prevent self referral
         */
        if (referrer.id === newUser.id) {
          throw new Error(
            "You cannot use your own referral code.",
          );
        }


        /*
         * Check whether already referred
         */
        const alreadyReferred =
          await tx.userReferral.findUnique({
            where: {
              referredUserId: newUser.id,
            },
          });

        if (alreadyReferred) {
          throw new Error(
            "Referral code has already been applied.",
          );
        }


        /*
         * Prevent referral loop
         */
        const reverseReferral =
          await tx.userReferral.findFirst({
            where: {
              referrerId: newUser.id,
              referredUserId: referrer.id,
            },
          });

        if (reverseReferral) {
          throw new Error(
            "Referral cannot be applied because you have already referred this user.",
          );
        }


        /*
         * Create referral
         */
        await tx.userReferral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: newUser.id,
            status: "PENDING",
          },
        });


        /*
         * Update referral statistics
         */
        await tx.userReferralStats.upsert({
          where: {
            userId: referrer.id,
          },

          update: {
            totalInvites: {
              increment: 1,
            },

            pendingRewards: {
              increment: 1,
            },
          },

          create: {
            userId: referrer.id,
            totalInvites: 1,
            pendingRewards: 1,
          },
        });
      }


      /*
       * =====================================================
       * FETCH COMPLETE USER
       * =====================================================
       */

      const userData = await tx.user.findUnique({
        where: {
          id: newUser.id,
        },
        select: userSelect,
      });

      return userData;
    },
  );


  /*
   * =======================================================
   * JWT
   * =======================================================
   */

  if (!result) {
    throw new Error(
      "Unable to retrieve user",
    );
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is not configured",
    );
  }

  const token = jwt.sign(
    {
      userId: result.id,
    },
    jwtSecret,
    {
      expiresIn: "7d",
    },
  );


  /*
   * =======================================================
   * FINAL RESPONSE
   * =======================================================
   */

  return {
    user: result,
    token,
    is_register: isRegister,
  };
};