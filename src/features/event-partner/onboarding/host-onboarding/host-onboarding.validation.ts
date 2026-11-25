import { z } from "zod";
import { hostPhoneNumberSchema } from "../host-invitation/host-invitation.validation";



/* -------------------------------------------------------------------------- */
/*                             ACCEPT INVITATION                              */
/* -------------------------------------------------------------------------- */

export const acceptInvitationSchema = z
  .object({
    accepted: z.literal(true),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                              PERSONAL DETAILS                              */
/* -------------------------------------------------------------------------- */

export const hostPersonalDetailsSchema = z
  .object({
    emergencyContactName: z
      .string()
      .trim()
      .min(2, "Emergency contact name is required")
      .max(100, "Emergency contact name is too long"),

    emergencyContactPhone: hostPhoneNumberSchema,
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                              CODE OF CONDUCT                               */
/* -------------------------------------------------------------------------- */

export const acceptCodeOfConductSchema = z
  .object({
    codeOfConductAccepted: z.literal(true),

    guestPrivacyAccepted: z.literal(true),

    safetyRulesAccepted: z.literal(true),
  })
  .strict();
