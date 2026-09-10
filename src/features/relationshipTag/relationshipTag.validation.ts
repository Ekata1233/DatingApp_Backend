import { z } from "zod";

export const relationshipTagSchema = z.object({
  receiverId: z
    .string()
    .uuid("Invalid receiver ID"),

  tag: z.enum([
    "IN_RELATIONSHIP",
    "OPEN_RELATIONSHIP",
    "ENGAGED",
    "DATE_TO_MARRY",
  ]),

  message: z
    .string()
    .trim()
    .max(20, "Message cannot exceed 20 characters")
    .optional(),
});

export type RelationshipTagProposalInput = z.infer<
  typeof relationshipTagSchema
>;