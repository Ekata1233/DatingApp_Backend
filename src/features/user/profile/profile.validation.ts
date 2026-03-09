import { z } from "zod";

export const nameValidation = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
});

// Birth Date schema
export const birthDateValidation = z.object({
  birth_date: z.string() // send date as string: YYYY-MM-DD
    .refine((dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const dayDiff = today.getDate() - date.getDate();

      if (
        age > 18 ||
        (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
      ) {
        return true;
      }
      return false;
    }, "User must be at least 18 years old")
});