import { z } from "zod";
import { HostGender, HostStatus } from "@prisma/client";

export const businessIdSchema = z.string().uuid({
  message: "Valid business ID is required",
});

export const hostIdSchema = z.string().uuid({
  message: "Valid host ID is required",
});

/* -------------------------------------------------------------------------- */
/*                             HOST PERMISSIONS                               */
/* -------------------------------------------------------------------------- */

export const hostPermissionsSchema = z
  .object({
    // Co-host permissions
    canViewGuestList: z.literal(true).optional(),

    canCheckInGuests: z.literal(true).optional(),

    canUpdateRunSheetProgress: z.literal(true).optional(),

    canViewRoomList: z.literal(true).optional(),

    canReportIncidentSOS: z.literal(true).optional(),

    canMessageGuests: z.boolean().optional(),

    canReplyToReviews: z.boolean().optional(),

    canCreateSubmitEvent: z.boolean().optional(),

    canEditEvent: z.boolean().optional(),

    canCancelEventRefund: z.boolean().optional(),

    canManagePayouts: z.boolean().optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                INVITE HOST                                 */
/* -------------------------------------------------------------------------- */

export const inviteHostSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name is required")
      .max(100),

    phoneNumber: z
      .string()
      .trim()
      .regex(
        /^\+91[6-9]\d{9}$/,
        "Enter a valid Indian mobile number with +91",
      ),

    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .optional(),

    gender: z.nativeEnum(HostGender).optional(),

    languages: z
      .array(z.string().trim().min(1).max(50))
      .max(20)
      .default([])
      .transform((values) => [...new Set(values)]),

    permissions: hostPermissionsSchema.optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                            UPDATE PERMISSIONS                              */
/* -------------------------------------------------------------------------- */

export const updateHostPermissionsSchema =
  hostPermissionsSchema.refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one permission is required",
    },
  );

/* -------------------------------------------------------------------------- */
/*                               GET HOSTS                                    */
/* -------------------------------------------------------------------------- */

export const getHostsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  search: z.string().trim().max(100).optional(),

  status: z.nativeEnum(HostStatus).optional(),
});
