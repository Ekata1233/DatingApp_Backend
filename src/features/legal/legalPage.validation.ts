import { z } from "zod";

/* ============================================================
   Legal page validation
   Pehle blocks: z.array(z.any()) tha — koi bhi garbage JSON
   DB me chala jata aur Flutter app render pe crash karti.
   Ab har block ka exact shape validate hota hai.
   ============================================================ */

/* Hex color only — style injection rokne ke liye (#RGB / #RRGGBB) */
const hexColor = z
  .string()
  .regex(/^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Color must be a hex code");

const markSchema = z.object({
  text: z.string().max(5000),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  color: hexColor.optional(),
  backgroundColor: hexColor.optional(),
  link: z.string().url().max(2048).optional(),
});

const marksArray = z.array(markSchema).min(1, "Content cannot be empty");

const listItemSchema = z.object({ content: marksArray });
const tableCellSchema = z.object({ content: z.array(markSchema) });

const headingBlock = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  content: marksArray,
});

const paragraphBlock = z.object({
  type: z.literal("paragraph"),
  content: marksArray,
});

const quoteBlock = z.object({
  type: z.literal("quote"),
  content: marksArray,
});

const bulletListBlock = z.object({
  type: z.literal("bulletList"),
  items: z.array(listItemSchema).min(1).max(100),
});

const numberedListBlock = z.object({
  type: z.literal("numberedList"),
  items: z.array(listItemSchema).min(1).max(100),
});

const tableBlock = z.object({
  type: z.literal("table"),
  id: z.string().max(64).optional(),
  headers: z.array(tableCellSchema).min(1).max(12),
  rows: z.array(z.object({ cells: z.array(tableCellSchema).min(1).max(12) })).max(200),
});

const dividerBlock = z.object({
  type: z.literal("divider"),
});

export const legalBlockSchema = z.discriminatedUnion("type", [
  headingBlock,
  paragraphBlock,
  quoteBlock,
  bulletListBlock,
  numberedListBlock,
  tableBlock,
  dividerBlock,
]);

export const legalPageValidation = z.object({
  pageType: z.enum([
    "TERMS_OF_SERVICE",
    "PRIVACY_POLICY",
    "COMMUNITY_GUIDELINES",
    "DATING_SAFETY_TIPS",
    "CHILD_SAFETY_STANDARDS",
    "AGE_POLICY_18_PLUS",
    "CONTENT_MODERATION_LAW_ENFORCEMENT",
    "REFUND_CANCELLATION_POLICY",
    "WALLET_COINS_TERMS",
    "FOREVER_LOVE_PROGRAMME_TERMS",
    "COOKIE_POLICY",
    "DATA_YOUR_RIGHTS",
    "VERIFICATION_ID_POLICY",
    "DELETE_ACCOUNT_DATA",
    "LICENSES_ACKNOWLEDGEMENTS",
    "GRIEVANCE_OFFICER_REDRESSAL",
  ]),

  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters"),

  content: z
    .object({
      schemaVersion: z.number().int().positive(),
      blocks: z
        .array(legalBlockSchema)
        .min(1, "At least one block is required")
        .max(500, "Too many blocks"),
      /* NOTE: html yahan deliberately allowed NAHI hai —
         .strict() client se bheja html reject kar dega.
         HTML sirf server generate karta hai. */
    })
    .strict(),
});