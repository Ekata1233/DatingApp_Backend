import { z } from "zod";


// ===============================
// Category Validation
// ===============================

export const createComplimentCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.number().optional(),
});


export const updateComplimentCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  sortOrder: z.number().optional(),
});



// ===============================
// Idea Validation
// ===============================

export const createComplimentIdeaSchema = z.object({
  categoryId: z.string().min(1, "Category id is required"),
  text: z.string().trim().min(1, "Compliment text is required"),
  sortOrder: z.number().optional(),
});


export const updateComplimentIdeaSchema = z.object({
  categoryId: z.string().optional(),
  text: z.string().trim().min(1).optional(),
  sortOrder: z.number().optional(),
});