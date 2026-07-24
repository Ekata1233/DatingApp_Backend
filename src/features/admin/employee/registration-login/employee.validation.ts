import { z } from "zod";
import { IdentityType } from "@prisma/client";

export const registerEmployeeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name is required")
    .max(100),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name is required")
    .max(100),

  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(30),

  address: z
    .string()
    .trim()
    .optional(),

  identityType: z
    .nativeEnum(IdentityType)
    .optional(),

  identityNumber: z
    .string()
    .trim()
    .optional(),

  identityImage: z
    .string()
    .optional(),

  roleId: z
    .string()
    .uuid("Invalid role id"),

  image: z
    .string()
    .optional(),
});