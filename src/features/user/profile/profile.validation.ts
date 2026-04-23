import { z } from "zod";

// ✅ FULL PROFILE VALIDATION
export const profileValidation = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name too long"),

  email: z.string().email("Invalid email address"),

  birth_date: z
    .string()
    .refine((dateStr) => !isNaN(Date.parse(dateStr)), {
      message: "Invalid date format (use YYYY-MM-DD)",
    })
    .refine((dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();

      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const dayDiff = today.getDate() - date.getDate();

      return (
        age > 18 ||
        (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
      );
    }, "User must be at least 18 years old"),

  height: z
    .number()
    .refine((val) => !isNaN(val), {
      message: "Height must be a number",
    })
    .min(50, "Height too short")
    .max(300, "Height too tall"),

  gender: z.string().min(1, "Gender is required"),
  gender_option: z.string().optional(),
});

export const locationValidation = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90),
  longitude: z
    .number()
    .min(-180)
    .max(180),
});

export const answerValidation = z.object({
  questionId: z.string().uuid(),
  optionIds: z.array(z.string()).min(1),
});

//Bio
export const bioValidation = z.object({
  bio: z
    .string()
    .max(300, "Bio cannot exceed 300 characters")
    .optional(),
});