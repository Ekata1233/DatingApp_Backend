import { z } from "zod";
import {
  StoreFeatureType,
  StoreItemType,
  StorePackBadge,
} from "@prisma/client";

export const createStoreFeatureSchema = z.object({
  itemType: z.nativeEnum(StoreItemType),

  feature: z.nativeEnum(StoreFeatureType),

  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable(),

  intValue: z
    .number()
    .int("Must be an integer")
    .optional(),

  decimalValue: z
    .number()
    .optional(),

  boolValue: z
    .boolean()
    .optional(),

  unit: z
    .string()
    .trim()
    .max(30)
    .optional(),

  enabled: z
    .boolean()
    .default(true)
    .optional(),

  premiumFree: z
    .boolean()
    .default(false)
    .optional(),
});

export const createStorePackSchema = z.object({
  itemType: z.nativeEnum(StoreItemType),

  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),

  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),

  pricePerUnit: z
    .number()
    .positive("Price per unit must be greater than 0"),

  totalPrice: z
    .number()
    .positive("Total price must be greater than 0"),

  badge: z
    .nativeEnum(StorePackBadge)
    .default(StorePackBadge.NONE)
    .optional(),

  sortOrder: z
    .number()
    .int()
    .default(0)
    .optional(),

  isActive: z
    .boolean()
    .default(true)
    .optional(),
});



export const createStoreInfoSchema = z.object({
  itemType: z.nativeEnum(StoreItemType),

  title: z.string().trim().min(1).max(100),

  description: z.string().trim().min(1).max(500),

  tag: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable(),

  sortOrder: z.number().int().optional(),

  isActive: z.boolean().optional(),
});

export const updateStoreInfoSchema =
  createStoreInfoSchema.partial();

export const updateStorePackSchema =
  createStorePackSchema.partial();