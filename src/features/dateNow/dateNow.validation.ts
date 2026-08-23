import { z } from "zod";

export const createDraftSchema = z.object({
  title: z.string().optional(),
});

export const updateDraftSchema = z.object({
  activityId: z.string().uuid().optional(),

  title: z.string().optional(),

  note: z.string().optional(),

  photoUrl: z.string().optional(),

  venueName: z.string().optional(),

  venueAddress: z.string().optional(),

  venueLat: z.number().optional(),

  venueLng: z.number().optional(),

  whoPaysId: z.string().uuid().optional(),

  participantLimit: z.number().min(1).optional(),

  joinRequestGenderId: z.string().uuid().optional(),

  visibilityId: z.string().uuid().optional(),

  vibeIds: z.array(z.string().uuid()).optional(),
});


export const updateDatePlanActivitySchema = z.object({
  activityId: z
    .string()
    .uuid("Invalid activityId"),
});
export const planIdParamSchema = z.object({
  planId: z
    .string()
    .uuid("Invalid planId"),
});