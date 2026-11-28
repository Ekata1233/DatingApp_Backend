import { z } from "zod";


// ==========================================
// EVENT PARAMS VALIDATION
// ==========================================

export const eventPayoutParamsSchema = z.object({
  eventId: z
    .string()
    .uuid("Invalid event ID"),
});


// ==========================================
// EVENT QUERY VALIDATION
// ==========================================

export const eventPayoutQuerySchema = z.object({
  eventDateId: z
    .string()
    .uuid("Invalid event date ID"),
});