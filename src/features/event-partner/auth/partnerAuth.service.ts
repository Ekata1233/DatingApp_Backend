import https from "https";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import {
  MSG91_AUTH_KEY,
  MSG91_TEMPLATE_ID,
} from "../../../config/msg91";
import {
  PartnerRole,
} from "../../../types/partnerAuth.types";
// ======================================================
// TYPES
// ======================================================
interface SendOtpInput {
  phoneNumber: string;
  type: PartnerRole;
  businessId?: unknown;
}
interface VerifyOtpInput {
  phoneNumber: string;
  otp: string;
  type: PartnerRole;
  deviceToken?: string;
  businessId?: unknown;
}
interface SelectRoleInput {
  partnerId: string;
  sessionId: string;
  role: PartnerRole;
  businessId: string;
}
interface GenerateTokenInput {
  partnerId: string;
  sessionId: string;
  role?: PartnerRole;
  businessId?: string;
}
interface Msg91Response {
  type: string;
  message?: string;
  request_id?: string;
}
// ======================================================
// HARDCODED OTP CONFIGURATION
// ======================================================
const isValidHardcodedOtp = (otp: string): boolean => {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_HARDCODED_OTP === "true" &&
    Boolean(process.env.HARDCODED_OTP) &&
    otp === process.env.HARDCODED_OTP
  );
};
// ======================================================
// VALIDATE PARTNER TYPE
// ======================================================
const validatePartnerType = (
  type: unknown,
): PartnerRole => {
  if (type !== "ORGANIZER" && type !== "HOST") {
    throw new Error(
      "Invalid type. Select ORGANIZER or HOST",
    );
  }
  return type;
};
// ======================================================
// NORMALIZE PHONE NUMBER
// ======================================================
const normalizePhoneNumber = (
  phoneNumber: string,
): string => {
  if (
    typeof phoneNumber !== "string" ||
    !phoneNumber.trim()
  ) {
    throw new Error("Phone number is required");
  }
  const cleanedPhone = phoneNumber
    .trim()
    .replace(/[\s()\-]/g, "");
  // International phone number
  if (!/^\+[1-9]\d{6,14}$/.test(cleanedPhone)) {
    throw new Error(
      "Invalid phone number. Include country code",
    );
  }
  // Indian mobile number
  if (
    cleanedPhone.startsWith("+91") &&
    !/^\+91[6-9]\d{9}$/.test(cleanedPhone)
  ) {
    throw new Error("Invalid Indian mobile number");
  }
  return cleanedPhone;
};
// ======================================================
// VALIDATE UUID
// ======================================================
const isValidUUID = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
};

const getSelectedHostBusiness = (type: PartnerRole, businessId: unknown) => {
  if (type !== "HOST" || businessId === undefined) return undefined;
  if (!isValidUUID(businessId)) throw new Error("Invalid business ID");
  return businessId;
};

const selectedHostWhere = (businessId: string, phoneNumber: string, now: Date) => {
  const linkedPartner = { phoneNumber, accountStatus: "ACTIVE", deletedAt: null } as const;
  return {
    businessId,
    phoneNumber,
    removedAt: null,
    declinedAt: null,
    business: {
      status: "ACTIVE",
      onboardingCompleted: true,
      partner: { accountStatus: "ACTIVE", deletedAt: null },
    },
    OR: [
      {
        status: "INVITED",
        onboardingStep: "INVITE_ACCEPTANCE",
        acceptedAt: null,
        invitationExpiresAt: { gt: now },
        OR: [{ partnerId: null }, { partner: linkedPartner }],
      },
      {
        status: { in: ["ONBOARDING", "ACTIVE", "PAUSED"] },
        acceptedAt: { not: null },
        partner: linkedPartner,
      },
    ],
  } satisfies Prisma.HostWhereInput;
};
// ======================================================
// JWT SECRET
// ======================================================
const getJwtSecret = () => {
  const secret = process.env.PARTNER_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "PARTNER_JWT_SECRET is not configured",
    );
  }
  return secret;
};
// ======================================================
// GENERATE PARTNER JWT
// ======================================================
const generatePartnerToken = ({
  partnerId,
  sessionId,
  role,
  businessId,
}: GenerateTokenInput) => {
  return jwt.sign(
    {
      partnerId,
      sessionId,
      tokenType: "PARTNER",
      ...(role && { role }),
      ...(businessId && { businessId }),
    },
    getJwtSecret(),
    {
      expiresIn: "30d",
      algorithm: "HS256",
    },
  );
};
// ======================================================
// COMMON MSG91 REQUEST
// ======================================================
const msg91Request = (
  method: "GET" | "POST",
  path: string,
  payload?: Record<string, unknown>,
): Promise<Msg91Response> => {
  if (!MSG91_AUTH_KEY) {
    throw new Error(
      "MSG91 auth key is not configured",
    );
  }
  const body = payload ? JSON.stringify(payload) : undefined;
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "control.msg91.com",
        path,
        method,
        headers: {
          authkey: MSG91_AUTH_KEY,
          "Content-Type": "application/json",
          ...(body !== undefined && {
            "Content-Length": Buffer.byteLength(body),
          }),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => {
          chunks.push(Buffer.from(chunk));
        });
        response.on("error", reject);
        response.on("end", () => {
          try {
            const body = Buffer.concat(chunks)
              .toString();
            const result: Msg91Response =
              JSON.parse(body);
            if (
              !response.statusCode ||
              response.statusCode < 200 ||
              response.statusCode >= 300
            ) {
              return reject(
                new Error(
                  result.message ||
                    "MSG91 request failed",
                ),
              );
            }
            if (result.type !== "success") {
              return reject(
                new Error(
                  result.message ||
                    "OTP request failed",
                ),
              );
            }
            resolve(result);
          } catch {
            reject(
              new Error("Invalid MSG91 response"),
            );
          }
        });
      },
    );
    request.on("error", reject);
    request.setTimeout(15000, () => {
      request.destroy(
        new Error("MSG91 request timed out"),
      );
    });
    if (body !== undefined) {
      request.write(body);
    }
    request.end();
  });
};
// ======================================================
// SEND OTP - ORGANIZER AND HOST
// ======================================================
export const sendPartnerOtp = async ({
  phoneNumber,
  type,
  businessId,
}: SendOtpInput) => {
  const formattedNumber =
    normalizePhoneNumber(phoneNumber);
  const partnerType = validatePartnerType(type);
  const selectedBusinessId = getSelectedHostBusiness(partnerType, businessId);
  if (selectedBusinessId) {
    const host = await prisma.host.findFirst({
      where: selectedHostWhere(selectedBusinessId, formattedNumber, new Date()),
      select: { id: true },
    });
    if (!host) throw new Error("No valid host invitation or account for the selected business");
  }
  // ============================================
  // MSG91 OTP - TEMPORARILY DISABLED
  // ============================================
  /*
  if (!MSG91_AUTH_KEY) {
    throw new Error("MSG91 auth key is not configured");
  }
  if (!MSG91_TEMPLATE_ID) {
    throw new Error("MSG91 template ID is not configured");
  }
  const mobile = formattedNumber.slice(1);
  const params = new URLSearchParams({
    template_id: MSG91_TEMPLATE_ID,
    mobile,
    otp_length: "6",
    otp_expiry: "10",
  });
  const result = await msg91Request(
    "POST",
    `/api/v5/otp?${params.toString()}`,
    {},
  );
  */
  // ============================================
  // DEVELOPMENT OTP
  // ============================================
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.ALLOW_HARDCODED_OTP !== "true" ||
    !/^\d{6}$/.test(process.env.HARDCODED_OTP || "")
  ) {
    throw new Error("Development OTP is not enabled");
  }
  return {
    phoneNumber: formattedNumber,
    type: partnerType,
    ...(selectedBusinessId && { businessId: selectedBusinessId }),
    otpSent: true,
    resendAfter: 30,
    expiresIn: 600,
  };
};
// ======================================================
// PARTNER SELECT
// ======================================================
const partnerProfileSelect = {
  id: true,
  fullName: true,
  phoneNumber: true,
  isPhoneVerified: true,
  phoneVerifiedAt: true,
  email: true,
  isEmailVerified: true,
  emailVerifiedAt: true,
  gender: true,
  languages: true,
  profilePhoto: true,
  whatsappUpdates: true,
  accountStatus: true,
  lastLoginAt: true,
  lastActiveAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const partnerSelect = {
  ...partnerProfileSelect,
  businesses: {
    select: {
      id: true,
      legalName: true,
      tradeName: true,
      brandName: true,
      status: true,
      onboardingStep: true,
      onboardingCompleted: true,
    },
  },
  hosts: {
    where: {
      removedAt: null,
    },
    select: {
      id: true,
      businessId: true,
      fullName: true,
      status: true,
      onboardingStep: true,
      onboardingCompleted: true,
      acceptedAt: true,
      joinedAt: true,
      business: {
        select: {
          id: true,
          legalName: true,
          tradeName: true,
          brandName: true,
          status: true,
          onboardingCompleted: true,
        },
      },
    },
  },
} as const;
// ======================================================
// VERIFY OTP - ORGANIZER AND HOST
// ======================================================
export const verifyPartnerOtp = async ({
  phoneNumber,
  otp,
  type,
  deviceToken,
  businessId,
}: VerifyOtpInput) => {
  const formattedNumber =
    normalizePhoneNumber(phoneNumber);
  const partnerType = validatePartnerType(type);
  if (businessId !== undefined && !isValidUUID(businessId)) {
    throw new Error("Invalid business ID");
  }
  const selectedBusinessId = typeof businessId === "string" ? businessId.toLowerCase() : undefined;
  if (typeof otp !== "string") {
    throw new Error("OTP must be a string");
  }
  const enteredOtp = otp.trim();
  if (!/^\d{6}$/.test(enteredOtp)) {
    throw new Error("Invalid OTP. Enter a 6-digit OTP");
  }
  if (
    deviceToken !== undefined &&
    typeof deviceToken !== "string"
  ) {
    throw new Error("Invalid device token");
  }
  getJwtSecret();
  // ============================================
  // HARDCODED OTP VERIFICATION
  // ============================================
  if (isValidHardcodedOtp(enteredOtp)) {
    console.log("Development OTP verified");
  }
  // ============================================
  // MSG91 VERIFICATION - TEMPORARILY DISABLED
  // ============================================
  /*
  else {
    const params = new URLSearchParams({
      mobile: formattedNumber.slice(1),
      otp: enteredOtp,
    });
    await msg91Request(
      "GET",
      `/api/v5/otp/verify?${params.toString()}`,
    );
  }
  */
  else {
    throw new Error("Invalid OTP");
  }
  return handleVerifiedPartner({
    phoneNumber: formattedNumber,
    deviceToken,
    type: partnerType,
    selectedBusinessId,
  });
};
// ======================================================
// 3. HANDLE VERIFIED PARTNER
// ======================================================
const handleVerifiedPartner = async ({
  phoneNumber,
  deviceToken,
    type,
  selectedBusinessId,
}: {
  phoneNumber: string;
  deviceToken?: string;
   type: PartnerRole;
  selectedBusinessId?: string;
}) => {
  const sessionId = randomUUID();
  const result = await prisma.$transaction(
    async (tx) => {
      const now = new Date();
      // ==========================================
      // PREVENT CONCURRENT REGISTRATION
      // ==========================================
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(
          hashtext(${phoneNumber})::bigint
        )::text
      `;
      // ==========================================
      // FIND EXISTING PARTNER
      // ==========================================
      const existingPartner =
        await tx.eventPartner.findUnique({
          where: {
            phoneNumber,
          },
        });
     // ==========================================
// HOST VALIDATION
// ==========================================

if (type === "HOST" && !selectedBusinessId) {
  console.log("========== HOST VALIDATION START ==========");

  console.log("Selected Type:", type);
  console.log("Phone Number:", phoneNumber);
  console.log("Current Date:", now);

  console.log(
    "Existing Partner ID:",
    existingPartner?.id || null,
  );

  // DEBUG: CHECK ALL HOST RECORDS
  const allHosts = await tx.host.findMany({
    where: {
      phoneNumber,
    },
    select: {
      id: true,
      businessId: true,
      partnerId: true,
      phoneNumber: true,
      status: true,
      acceptedAt: true,
      declinedAt: true,
      removedAt: true,
      invitationExpiresAt: true,
    },
  });

  console.log(
    "Total Host Records:",
    allHosts.length,
  );

  console.log(
    "All Host Records:",
    JSON.stringify(allHosts, null, 2),
  );

  // EXISTING HOST VALIDATION LOGIC
  const existingHost = await tx.host.findFirst({
    where: {
      phoneNumber,
      removedAt: null,
      declinedAt: null,

      OR: [
        ...(existingPartner
          ? [
              {
                partnerId: existingPartner.id,
                acceptedAt: {
                  not: null,
                },
              },
            ]
          : []),

        {
          partnerId: null,
          status: "INVITED",
          acceptedAt: null,
          invitationExpiresAt: {
            gt: now,
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  console.log("Valid Host Found:", existingHost);

  if (!existingHost) {
    console.log("HOST VALIDATION FAILED");

    if (allHosts.length === 0) {
      console.log(
        "REASON: No host record exists for this phone number",
      );
    } else {
      for (const host of allHosts) {
        console.log("========== HOST RECORD CHECK ==========");

        console.log("Host ID:", host.id);
        console.log("Status:", host.status);
        console.log("Partner ID:", host.partnerId);
        console.log("Accepted At:", host.acceptedAt);
        console.log("Declined At:", host.declinedAt);
        console.log("Removed At:", host.removedAt);

        console.log(
          "Invitation Expired:",
          host.invitationExpiresAt
            ? host.invitationExpiresAt <= now
            : null,
        );
      }
    }

    throw new Error(
      "No valid host invitation or host account found",
    );
  }

  console.log("HOST VALIDATION SUCCESS");
  console.log("========== HOST VALIDATION END ==========");
}
      const isRegister = !existingPartner;
      let partnerId: string;
      // ==========================================
      // EXISTING PARTNER LOGIN
      // ==========================================
      if (existingPartner) {
        if (
          existingPartner.deletedAt ||
          existingPartner.accountStatus !== "ACTIVE"
        ) {
          throw new Error(
            "Your partner account is not active",
          );
        }
        const updatedPartner =
          await tx.eventPartner.update({
            where: {
              id: existingPartner.id,
            },
            data: {
              isPhoneVerified: true,
              phoneVerifiedAt:
                existingPartner.phoneVerifiedAt ||
                now,
              // Replace previous session
              sessionId,
              deviceToken: deviceToken || null,
              lastLoginAt: now,
              lastActiveAt: now,
            },
          });
        partnerId = updatedPartner.id;
      }
      // ==========================================
      // NEW PARTNER REGISTRATION
      // ==========================================
      else {
        const newPartner =
          await tx.eventPartner.create({
            data: {
              phoneNumber,
              isPhoneVerified: true,
              phoneVerifiedAt: now,
              accountStatus: "ACTIVE",
              sessionId,
              deviceToken: deviceToken || null,
              lastLoginAt: now,
              lastActiveAt: now,
            },
          });
        partnerId = newPartner.id;
      }
      // Create an Organizer draft only when no business exists.
      if (type === "ORGANIZER" && !selectedBusinessId) {
        const existingBusiness = await tx.businessDetails.findFirst({
          where: { partnerId },
          select: { id: true },
        });
        if (!existingBusiness) {
          await tx.businessDetails.create({
            data: {
              partnerId,
              status: "DRAFT",
              onboardingCompleted: false,
            },
          });
        }
      }
      // ==========================================
      // GET COMPLETE PARTNER
      // ==========================================
      if (type === "HOST" && selectedBusinessId) {
        const where = selectedHostWhere(selectedBusinessId, phoneNumber, new Date());
        const host = await tx.host.findFirst({
          where,
          select: {
            id: true,
            fullName: true,
            businessId: true,
            partnerId: true,
            status: true,
            acceptedAt: true,
            invitedAt: true,
            invitationExpiresAt: true,
            onboardingStep: true,
            onboardingCompleted: true,
            business: { select: { id: true, brandName: true, tradeName: true, legalName: true } },
          },
        });
        if (!host || (host.partnerId && host.partnerId !== partnerId)) {
          throw new Error("No valid host invitation or account for the selected business");
        }
        if (!host.partnerId) {
          const linked = await tx.host.updateMany({
            where: { ...where, id: host.id, partnerId: null, status: "INVITED" },
            data: { partnerId },
          });
          if (linked.count !== 1) throw new Error("Host invitation changed. Select the business again");
        }
        const partner = await tx.eventPartner.findUniqueOrThrow({
          where: { id: partnerId },
          select: {
            ...partnerSelect,
            businesses: { ...partnerSelect.businesses, where: { id: selectedBusinessId } },
            hosts: {
              ...partnerSelect.hosts,
              where: { ...partnerSelect.hosts.where, businessId: selectedBusinessId },
            },
          },
        });
        return { partner, isRegister, selectedHost: host } as const;
      }
      const partner = await tx.eventPartner.findUniqueOrThrow({
        where: { id: partnerId },
        select: partnerSelect,
      });
      // ==========================================
      // FIND PENDING HOST INVITATIONS
      // ==========================================
      const pendingInvitations =
        await tx.host.findMany({
          where: {
            phoneNumber,
            partnerId: null,
            status: "INVITED",
            acceptedAt: null,
            declinedAt: null,
            removedAt: null,
            invitationExpiresAt: {
              gt: now,
            },
          },
          select: {
            id: true,
            fullName: true,
            businessId: true,
            status: true,
            onboardingStep: true,
            invitedAt: true,
            invitationExpiresAt: true,
            business: {
              select: {
                id: true,
                legalName: true,
                tradeName: true,
                brandName: true,
              },
            },
          },
          orderBy: {
            invitedAt: "desc",
          },
        });
      // ==========================================
      // ORGANIZER ACCOUNTS
      // ==========================================
      const organizerAccounts =
        partner.businesses.map((business) => ({
          role: "ORGANIZER" as const,
          businessId: business.id,
          businessName:
            business.brandName ||
            business.tradeName ||
            business.legalName,
          status: business.status,
          onboardingStep:
            business.onboardingStep,
          onboardingCompleted:
            business.onboardingCompleted,
          canAccessDashboard:
            business.status === "ACTIVE" &&
            business.onboardingCompleted,
        }));
      // ==========================================
      // HOST ACCOUNTS
      // ==========================================
      const hostAccounts = partner.hosts
        .filter(
          (host) => host.acceptedAt !== null,
        )
        .map((host) => ({
          role: "HOST" as const,
          hostId: host.id,
          businessId: host.businessId,
          businessName:
            host.business.brandName ||
            host.business.tradeName ||
            host.business.legalName,
          status: host.status,
          onboardingStep:
            host.onboardingStep,
          onboardingCompleted:
            host.onboardingCompleted,
          canAccessDashboard:
            host.status === "ACTIVE" &&
            host.onboardingCompleted &&
            host.business.status === "ACTIVE" &&
            host.business.onboardingCompleted,
        }));
      // ==========================================
      // AVAILABLE ACCOUNTS
      // ==========================================
      const availableAccounts = type === "ORGANIZER"
        ? organizerAccounts
        : hostAccounts;
      const selectedOrganizer = type === "ORGANIZER"
        ? selectedBusinessId
          ? organizerAccounts.find((account) => account.businessId === selectedBusinessId)
          : organizerAccounts.length === 1 ? organizerAccounts[0] : undefined
        : undefined;
      if (type === "ORGANIZER" && selectedBusinessId && !selectedOrganizer) {
        throw new Error("You are not the organizer of this business");
      }
      const roles = [
        ...new Set(
          [...organizerAccounts, ...hostAccounts].map(
            (account) => account.role,
          ),
        ),
      ];
      const isOrganizer =
        organizerAccounts.length > 0;
      const isHost =
        hostAccounts.length > 0;
      const hasPendingInvitation =
        pendingInvitations.length > 0;
      // ==========================================
      // DETERMINE NEXT SCREEN
      // ==========================================
      let nextScreen: string;
      if (type === "ORGANIZER") {
        if (selectedOrganizer) {
          nextScreen = getOrganizerNextScreen(selectedOrganizer);
        } else if (availableAccounts.length > 0) {
          nextScreen = "SELECT_ACCOUNT";
        } else {
          nextScreen = "ORGANIZER_ONBOARDING";
        }
      } else if (availableAccounts.length > 0) {
        nextScreen = "SELECT_ACCOUNT";
      } else if (hasPendingInvitation) {
        nextScreen = "HOST_INVITATION";
      } else {
        nextScreen = "HOST_STATUS";
      }
      return {
        partner,
        isRegister,
        roles,
        isOrganizer,
        isHost,
        availableAccounts,
        pendingInvitations,
        hasPendingInvitation,
        nextScreen,
        selectedOrganizer,
      };
    },
  );
  // ============================================
  // GENERATE COMMON JWT
  // ============================================
  if (result.selectedHost) {
    const host = result.selectedHost;
    const businessName = host.business.brandName || host.business.tradeName || host.business.legalName;
    const isHost = host.acceptedAt !== null;
    const isOrganizer = result.partner.businesses.length > 0;
    let nextScreen = "HOST_INVITATION";
    if (isHost) {
      if (host.status === "PAUSED") nextScreen = "HOST_STATUS";
      else nextScreen = host.onboardingCompleted ? "HOST_DASHBOARD" : "HOST_ONBOARDING";
    }
    return {
      partner: result.partner,
      token: generatePartnerToken({
        partnerId: result.partner.id,
        sessionId,
        role: "HOST",
        businessId: host.businessId,
      }),
      type,
      role: "HOST" as const,
      businessId: host.businessId,
      businessName,
      is_register: result.isRegister,
      roles: [
        ...(isOrganizer ? ["ORGANIZER" as const] : []),
        ...(isHost ? ["HOST" as const] : []),
      ],
      isOrganizer,
      isHost,
      availableAccounts: isHost ? [{
        role: "HOST" as const,
        hostId: host.id,
        businessId: host.businessId,
        businessName,
        status: host.status,
        onboardingStep: host.onboardingStep,
        onboardingCompleted: host.onboardingCompleted,
        canAccessDashboard: host.status === "ACTIVE" && host.onboardingCompleted,
      }] : [],
      hasPendingInvitation: !isHost,
      pendingInvitations: [],
      hostData: [{
        id: host.id,
        fullName: host.fullName,
        businessId: host.businessId,
        status: host.status,
        onboardingStep: host.onboardingStep,
        invitedAt: host.invitedAt,
        invitationExpiresAt: host.invitationExpiresAt,
        business: host.business,
      }],
      onboardingStep: host.onboardingStep,
      onboardingCompleted: host.onboardingCompleted,
      nextScreen,
    };
  }

  const organizer = result.selectedOrganizer;
  const token = generatePartnerToken({
    partnerId: result.partner.id,
    sessionId,
    role: organizer?.role,
    businessId: organizer?.businessId,
  });
  // ============================================
  // FINAL RESPONSE
  // ============================================
  return {
    partner: result.partner,
    token,
    type,
    ...(organizer && {
      role: organizer.role,
      businessId: organizer.businessId,
      onboardingStep: organizer.onboardingStep,
      onboardingCompleted: organizer.onboardingCompleted,
    }),
    is_register: result.isRegister,
    roles: result.roles,
    isOrganizer: result.isOrganizer,
    isHost: result.isHost,
    availableAccounts:
      result.availableAccounts,
    pendingInvitations:
      result.pendingInvitations,
    hasPendingInvitation:
      result.hasPendingInvitation,
    nextScreen: result.nextScreen,
  };
};
// ======================================================
// 4. SELECT ORGANIZER OR HOST ROLE
// ======================================================
const getOrganizerNextScreen = (business: { onboardingCompleted: boolean; status: string }) => {
  if (!business.onboardingCompleted) return "ORGANIZER_ONBOARDING";
  return business.status === "ACTIVE" ? "ORGANIZER_DASHBOARD" : "BUSINESS_STATUS";
};

export const selectPartnerRole = async ({
  partnerId,
  sessionId,
  role,
  businessId,
}: SelectRoleInput) => {
  // ============================================
  // VALIDATION
  // ============================================
  if (role !== "ORGANIZER" && role !== "HOST") {
    throw new Error("Invalid partner role");
  }
  if (!isValidUUID(businessId)) {
    throw new Error("Valid business ID is required");
  }
  // ============================================
  // CHECK ACTIVE SESSION
  // ============================================
  const partner =
    await prisma.eventPartner.findFirst({
      where: {
        id: partnerId,
        sessionId,
        accountStatus: "ACTIVE",
        isPhoneVerified: true,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  if (!partner) {
    throw new Error(
      "Session expired. Please login again",
    );
  }
  // ============================================
  // ORGANIZER ROLE
  // ============================================
  if (role === "ORGANIZER") {
    const business =
      await prisma.businessDetails.findFirst({
        where: {
          id: businessId,
          partnerId,
        },
        select: {
          id: true,
          legalName: true,
          brandName: true,
          tradeName: true,
          status: true,
          onboardingStep: true,
          onboardingCompleted: true,
        },
      });
    if (!business) {
      throw new Error(
        "You are not the organizer of this business",
      );
    }
    // ==========================================
    // DETERMINE NEXT SCREEN
    // ==========================================
    const nextScreen = getOrganizerNextScreen(business);
    // ==========================================
    // ORGANIZER JWT
    // ==========================================
    const token = generatePartnerToken({
      partnerId,
      sessionId,
      role: "ORGANIZER",
      businessId,
    });
    return {
      token,
      role: "ORGANIZER",
      businessId,
      hostId: null,
      business,
      onboardingStep:
        business.onboardingStep,
      onboardingCompleted:
        business.onboardingCompleted,
      nextScreen,
    };
  }
  // ============================================
  // HOST ROLE
  // ============================================
  const host = await prisma.host.findFirst({
    where: {
      partnerId,
      businessId,
      acceptedAt: {
        not: null,
      },
      declinedAt: null,
      removedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      businessId: true,
      status: true,
      onboardingStep: true,
      onboardingCompleted: true,
      business: {
        select: {
          id: true,
          legalName: true,
          tradeName: true,
          brandName: true,
          status: true,
          onboardingCompleted: true,
        },
      },
    },
  });
  if (!host) {
    throw new Error(
      "You are not an accepted host of this business",
    );
  }
  // ============================================
  // DETERMINE HOST NEXT SCREEN
  // ============================================
  let nextScreen: string;
  if (!host.onboardingCompleted) {
    nextScreen = "HOST_ONBOARDING";
  }
  else if (host.status !== "ACTIVE") {
    nextScreen = "HOST_STATUS";
  }
  else if (
    host.business.status !== "ACTIVE" ||
    !host.business.onboardingCompleted
  ) {
    nextScreen = "BUSINESS_STATUS";
  }
  else {
    nextScreen = "HOST_DASHBOARD";
  }
  // ============================================
  // GENERATE HOST JWT
  // ============================================
  const token = generatePartnerToken({
    partnerId,
    sessionId,
    role: "HOST",
    businessId,
  });
  return {
    token,
    role: "HOST",
    businessId,
    hostId: host.id,
    host,
    onboardingStep:
      host.onboardingStep,
    onboardingCompleted:
      host.onboardingCompleted,
    nextScreen,
  };
};
// ======================================================
// 5. LOGOUT
// ======================================================
export const partnerLogoutService = async (
  partnerId: string,
  sessionId: string,
) => {
  const result =
    await prisma.eventPartner.updateMany({
      where: {
        id: partnerId,
        sessionId,
      },
      data: {
        sessionId: null,
        deviceToken: null,
      },
    });
  if (result.count === 0) {
    throw new Error(
      "Session expired or already logged out",
    );
  }
  return {
    message: "Logged out successfully",
  };
};
