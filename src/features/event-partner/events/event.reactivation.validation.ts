import { z } from "zod";

export const reactivationIdSchema = z
  .string()
  .uuid("Invalid reactivation ID");

const dateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const reactivationDateSchema = z
  .object({
    startDateTime: dateTimeSchema,

    endDateTime: dateTimeSchema,

    gateOpensAt: dateTimeSchema
      .nullable()
      .optional(),

    timezone: z
      .string()
      .default("Asia/Kolkata")
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en-IN", {
            timeZone: value,
          });

          return true;
        } catch {
          return false;
        }
      }, "Invalid timezone"),

    isPrimary: z.boolean().default(false),

    isMoreDate: z.boolean().default(false),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.endDateTime <= data.startDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDateTime"],
        message:
          "End date and time must be after start date and time",
      });
    }

    if (
      data.gateOpensAt &&
      data.gateOpensAt > data.startDateTime
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gateOpensAt"],
        message:
          "Gate opening time cannot be after event start time",
      });
    }
  });

export const saveReactivationSchema = z
  .object({
    dates: z
      .array(reactivationDateSchema)
      .min(1, "At least one event date is required")
      .max(50, "Maximum 50 dates are allowed"),
  })
  .strict()
  .superRefine((data, ctx) => {
    const timestamps = data.dates.map(
      (date) => date.startDateTime.getTime()
    );

    if (
      new Set(timestamps).size !== timestamps.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dates"],
        message: "Duplicate event dates are not allowed",
      });
    }

    const primaryDates = data.dates.filter(
      (date) => date.isPrimary
    );

    if (primaryDates.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dates"],
        message: "Only one primary date is allowed",
      });
    }

    const sortedDates = [...data.dates].sort(
      (a, b) =>
        a.startDateTime.getTime() -
        b.startDateTime.getTime()
    );

    for (let i = 1; i < sortedDates.length; i++) {
      if (
        sortedDates[i].startDateTime <
        sortedDates[i - 1].endDateTime
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dates"],
          message: "Event dates cannot overlap",
        });

        break;
      }
    }
  });

export const getReactivationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
  })
  .strict();