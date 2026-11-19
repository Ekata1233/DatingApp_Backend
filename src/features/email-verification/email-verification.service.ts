import {
  randomInt,
  randomUUID,
  createHmac,
} from "crypto";

import { prisma } from "../../prisma/prismaClient";
import { redis } from "../../lib/redis";
import { sendMSG91EmailOtp } from "../../config/msg91Email";

import {
  SendEmailOtpInput,
  VerifyEmailOtpInput,
  SendEmailOtpResponse,
  VerifyEmailOtpResponse,
  EMAIL_OTP_CONFIG,
  EmailVerificationError,
} from "./email-verification.types";

/* -------------------------------------------------------------------------- */
/*                              NORMALIZE EMAIL                               */
/* -------------------------------------------------------------------------- */

const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/* -------------------------------------------------------------------------- */
/*                              GENERATE OTP                                  */
/* -------------------------------------------------------------------------- */

const generateOtp = (): string => {
  return randomInt(0, 1000000)
    .toString()
    .padStart(6, "0");
};

/* -------------------------------------------------------------------------- */
/*                              HASH OTP                                      */
/* -------------------------------------------------------------------------- */

const hashOtp = (
  partnerId: string,
  email: string,
  otp: string,
): string => {
  const secret = process.env.EMAIL_OTP_SECRET;

  if (!secret) {
    throw new Error("EMAIL_OTP_SECRET is missing");
  }

  return createHmac("sha256", secret)
    .update(
      JSON.stringify([
        "event-partner",
        partnerId,
        email,
        otp,
      ]),
    )
    .digest("hex");
};

/* -------------------------------------------------------------------------- */
/*                              REDIS KEYS                                    */
/* -------------------------------------------------------------------------- */

const getRedisKeys = (partnerId: string) => {
  return {
    otpKey:
      `partner:email:verification:otp:${partnerId}`,

    cooldownKey:
      `partner:email:verification:cooldown:${partnerId}`,

    rateLimitKey:
      `partner:email:verification:rate:${partnerId}`,
  };
};

/* -------------------------------------------------------------------------- */
/*                              SEND EMAIL OTP                                */
/* -------------------------------------------------------------------------- */

export const sendEmailOtpService = async (
  partnerId: string,
  payload: SendEmailOtpInput,
): Promise<SendEmailOtpResponse> => {

  const email = normalizeEmail(payload.email);

  /* ------------------------------------------------------------------------ */
  /*                         1. VALIDATE EVENT PARTNER                        */
  /* ------------------------------------------------------------------------ */

  const partner = await prisma.eventPartner.findUnique({
    where: {
      id: partnerId,
    },
    select: {
      id: true,
      email: true,
      isEmailVerified: true,
      accountStatus: true,
      deletedAt: true,
    },
  });

  if (!partner) {
    throw new EmailVerificationError(
      404,
      "Event partner not found",
    );
  }

  if (
    partner.accountStatus !== "ACTIVE" ||
    partner.deletedAt
  ) {
    throw new EmailVerificationError(
      403,
      "Event partner account is not active",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         2. CHECK VERIFIED EMAIL                          */
  /* ------------------------------------------------------------------------ */

  if (
    partner.email?.toLowerCase() === email &&
    partner.isEmailVerified
  ) {
    throw new EmailVerificationError(
      400,
      "Email is already verified",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         3. CHECK DUPLICATE EMAIL                         */
  /* ------------------------------------------------------------------------ */

  const existingPartner =
    await prisma.eventPartner.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
        NOT: {
          id: partnerId,
        },
      },
      select: {
        id: true,
      },
    });

  if (existingPartner) {
    throw new EmailVerificationError(
      409,
      "Email address is already in use",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         4. GENERATE OTP                                  */
  /* ------------------------------------------------------------------------ */

  const otp = generateOtp();

  const hashedOtp = hashOtp(
    partnerId,
    email,
    otp,
  );

  const otpRequestId = randomUUID();

  const {
    otpKey,
    cooldownKey,
    rateLimitKey,
  } = getRedisKeys(partnerId);

  /* ------------------------------------------------------------------------ */
  /*                         5. STORE OTP IN REDIS                            */
  /* ------------------------------------------------------------------------ */

  const result = await redis.eval<
    (string | number)[],
    number
  >(
    `
      -- Check resend cooldown

      if redis.call('EXISTS', KEYS[2]) == 1 then
        return -1
      end

      -- Check hourly OTP request limit

      local count = tonumber(
        redis.call('GET', KEYS[3]) or '0'
      )

      if count >= tonumber(ARGV[5]) then
        return -2
      end

      -- Increment OTP request count

      count = redis.call('INCR', KEYS[3])

      if count == 1 then
        redis.call(
          'EXPIRE',
          KEYS[3],
          ARGV[6]
        )
      end

      -- Set resend cooldown

      redis.call(
        'SET',
        KEYS[2],
        ARGV[7],
        'EX',
        ARGV[4]
      )

      -- Remove previous OTP

      redis.call('DEL', KEYS[1])

      -- Store new OTP details

      redis.call(
        'HSET',
        KEYS[1],
        'email', ARGV[1],
        'hash', ARGV[2],
        'attempts', '0',
        'requestId', ARGV[7]
      )

      -- Set OTP expiry

      redis.call(
        'EXPIRE',
        KEYS[1],
        ARGV[3]
      )

      return 1
    `,
    [
      otpKey,
      cooldownKey,
      rateLimitKey,
    ],
    [
      email,
      hashedOtp,
      EMAIL_OTP_CONFIG.EXPIRY_SECONDS,
      EMAIL_OTP_CONFIG.RESEND_SECONDS,
      EMAIL_OTP_CONFIG.MAX_SEND_ATTEMPTS,
      EMAIL_OTP_CONFIG.RATE_LIMIT_SECONDS,
      otpRequestId,
    ],
  );

  /* ------------------------------------------------------------------------ */
  /*                         6. HANDLE REDIS RESULT                           */
  /* ------------------------------------------------------------------------ */

  if (result === -1) {
    throw new EmailVerificationError(
      429,
      `Please wait ${EMAIL_OTP_CONFIG.RESEND_SECONDS} seconds before requesting another OTP`,
    );
  }

  if (result === -2) {
    throw new EmailVerificationError(
      429,
      "OTP request limit reached. Please try again later",
    );
  }

  if (result !== 1) {
    throw new EmailVerificationError(
      503,
      "Unable to initialize OTP verification",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         7. SEND EMAIL USING MSG91                        */
  /* ------------------------------------------------------------------------ */

  try {
    const response = await sendMSG91EmailOtp(
      email,
      otp,
    );

    return {
      email,
      requestId: response.requestId,
      expiresIn: EMAIL_OTP_CONFIG.EXPIRY_SECONDS,
      resendAfter: EMAIL_OTP_CONFIG.RESEND_SECONDS,
    };

  } catch (error) {

    /* ---------------------------------------------------------------------- */
    /*                       CLEANUP FAILED OTP REQUEST                       */
    /* ---------------------------------------------------------------------- */

    try {
      await redis.eval<
        (string | number)[],
        number
      >(
        `
          if redis.call(
            'HGET',
            KEYS[1],
            'requestId'
          ) == ARGV[1] then

            redis.call('DEL', KEYS[1])

          end

          return 1
        `,
        [otpKey],
        [otpRequestId],
      );

    } catch {
      console.error("Email OTP cleanup failed");
    }

    throw new EmailVerificationError(
      503,
      "Unable to send email OTP. Please try again",
    );
  }
};

/* -------------------------------------------------------------------------- */
/*                              VERIFY EMAIL OTP                              */
/* -------------------------------------------------------------------------- */

export const verifyEmailOtpService = async (
  partnerId: string,
  payload: VerifyEmailOtpInput,
): Promise<VerifyEmailOtpResponse> => {

  const email = normalizeEmail(payload.email);

  /* ------------------------------------------------------------------------ */
  /*                         1. VALIDATE EVENT PARTNER                        */
  /* ------------------------------------------------------------------------ */

  const partner = await prisma.eventPartner.findUnique({
    where: {
      id: partnerId,
    },
    select: {
      id: true,
      accountStatus: true,
      deletedAt: true,
    },
  });

  if (!partner) {
    throw new EmailVerificationError(
      404,
      "Event partner not found",
    );
  }

  if (
    partner.accountStatus !== "ACTIVE" ||
    partner.deletedAt
  ) {
    throw new EmailVerificationError(
      403,
      "Event partner account is not active",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         2. GET REDIS OTP KEY                             */
  /* ------------------------------------------------------------------------ */

  const { otpKey } = getRedisKeys(partnerId);

  const hashedOtp = hashOtp(
    partnerId,
    email,
    payload.otp,
  );

  /* ------------------------------------------------------------------------ */
  /*                         3. VERIFY OTP ATOMICALLY                         */
  /* ------------------------------------------------------------------------ */

  const result = await redis.eval<
    (string | number)[],
    number
  >(
    `
      -- Check OTP existence

      local storedHash = redis.call(
        'HGET',
        KEYS[1],
        'hash'
      )

      if not storedHash then
        return -1
      end

      -- Check email address

      local storedEmail = redis.call(
        'HGET',
        KEYS[1],
        'email'
      )

      if storedEmail ~= ARGV[1] then
        return -3
      end

      -- Check verification attempts

      local attempts = tonumber(
        redis.call(
          'HGET',
          KEYS[1],
          'attempts'
        ) or '0'
      )

      if attempts >= tonumber(ARGV[3]) then
        redis.call('DEL', KEYS[1])
        return -2
      end

      -- Compare hashed OTP

      if storedHash ~= ARGV[2] then

        attempts = redis.call(
          'HINCRBY',
          KEYS[1],
          'attempts',
          1
        )

        if attempts >= tonumber(ARGV[3]) then
          redis.call('DEL', KEYS[1])
          return -2
        end

        return 0
      end

      -- Delete OTP after successful verification

      redis.call('DEL', KEYS[1])

      return 1
    `,
    [otpKey],
    [
      email,
      hashedOtp,
      EMAIL_OTP_CONFIG.MAX_VERIFY_ATTEMPTS,
    ],
  );

  /* ------------------------------------------------------------------------ */
  /*                         4. HANDLE VERIFICATION RESULT                    */
  /* ------------------------------------------------------------------------ */

  if (result === -1) {
    throw new EmailVerificationError(
      400,
      "OTP expired or not found",
    );
  }

  if (result === -2) {
    throw new EmailVerificationError(
      429,
      "Maximum verification attempts reached. Request a new OTP",
    );
  }

  if (result === -3) {
    throw new EmailVerificationError(
      400,
      "Email does not match the requested OTP",
    );
  }

  if (result !== 1) {
    throw new EmailVerificationError(
      400,
      "Invalid OTP",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         5. UPDATE VERIFIED EMAIL                         */
  /* ------------------------------------------------------------------------ */

  const updatedPartner =
    await prisma.eventPartner.update({
      where: {
        id: partnerId,
        accountStatus: "ACTIVE",
        deletedAt: null,
      },
      data: {
        email,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
      },
    });

  return updatedPartner;
};