// import { z } from "zod";

// import {
//   EventDurationType,
//   TripType,
//   EventStatus,
//   EventReactiveStatus,
//   EventDateStatus,
// } from "@prisma/client";

// export const getAllOrganizerEventsSchema = z.object({
//   type: z
//     .enum([
//       "all",
//       "upcoming",
//       "in_review",
//       "drafts",
//       "past",
//       "on_sale",
//       "rejected",
//       "paused",
//       "approved",
//     ])
//     .default("all"),

//   search: z
//     .string()
//     .trim()
//     .max(100)
//     .optional(),

//   eventDurationType: z
//     .nativeEnum(EventDurationType)
//     .optional(),

//   tripType: z
//     .nativeEnum(TripType)
//     .optional(),

//   categoryId: z
//     .string()
//     .uuid("Invalid category ID")
//     .optional(),

//   status: z
//     .nativeEnum(EventStatus)
//     .optional(),

//   eventReactiveStatus: z
//     .nativeEnum(EventReactiveStatus)
//     .optional(),

//   eventDateStatus: z
//     .nativeEnum(EventDateStatus)
//     .optional(),

//   page: z.coerce
//     .number()
//     .int()
//     .min(1)
//     .max(100000)
//     .default(1),

//   limit: z.coerce
//     .number()
//     .int()
//     .min(1)
//     .max(100)
//     .default(20),
// });

// export type GetAllOrganizerEventsQuery = z.infer<
//   typeof getAllOrganizerEventsSchema
// >;