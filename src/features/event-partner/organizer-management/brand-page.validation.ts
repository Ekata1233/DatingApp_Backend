import { UploadedFile } from "express-fileupload";
import { z } from "zod";

const instagramUrlSchema = z.url({
  protocol: /^https$/,
  hostname: /^(?:www\.)?instagram\.com$/i,
});

export const brandPageSchema = z.object({
  tagline: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullish(),
  instagramUrl: z.string().trim().max(300)
    .pipe(z.union([z.literal(""), instagramUrlSchema])).nullish(),
  removeCoverPhoto: z.union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional().transform((value) => value === true || value === "true"),
});

export type BrandPageInput = z.infer<typeof brandPageSchema>;

export const getBrandImageExtension = (file: UploadedFile): "jpg" | "png" | null => {
  const { data } = file;
  if (file.truncated || data.length > 5 * 1024 * 1024) return null;
  if (data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpg";
  if (data.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "png";
  return null;
};
