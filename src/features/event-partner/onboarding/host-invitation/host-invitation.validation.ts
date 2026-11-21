import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                           MOBILE NUMBER VALIDATION                         */
/* -------------------------------------------------------------------------- */

export const hostPhoneNumberSchema = z
  .string()
  .trim()
  .transform((value) => {
    const phone = value.replace(/[\s-]/g, "");

    if (/^[6-9]\d{9}$/.test(phone)) {
      return `+91${phone}`;
    }

    return phone;
  })
  .pipe(
    z.string().regex(
      /^\+91[6-9]\d{9}$/,
      "Enter a valid Indian mobile number",
    ),
  );

/* -------------------------------------------------------------------------- */
/*                           HOST INVITATION LOOKUP                           */
/* -------------------------------------------------------------------------- */

export const hostInvitationLookupSchema = z
  .object({
    phoneNumber: hostPhoneNumberSchema,
  })
  .strict();