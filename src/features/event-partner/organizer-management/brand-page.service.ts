import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import imagekit from "../../../utils/imagekit";
import type { BrandPageInput } from "./brand-page.validation";

export class BrandPageError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

type BrandImage = { data: Buffer; extension: "jpg" | "png" };
type BrandImages = { logo?: BrandImage; coverPhoto?: BrandImage };

const brandPageSelect = {
  id: true,
  brandName: true,
  tradeName: true,
  logoUrl: true,
  coverPhotoUrl: true,
  tagline: true,
  description: true,
  instagramUrl: true,
  website: true,
  hostingSince: true,
} as const satisfies Prisma.BusinessDetailsSelect;

const formatBrandPage = ({
  id,
  brandName,
  tradeName,
  ...profile
}: Prisma.BusinessDetailsGetPayload<{ select: typeof brandPageSelect }>) => ({
  businessId: id,
  brandName: brandName || tradeName,
  ...profile,
});

export const getBrandPage = async (businessId: string, guestView = false) => {
  const business = await prisma.businessDetails.findUnique({
    where: {
      id: businessId,
      ...(guestView ? {
        status: "ACTIVE",
        onboardingCompleted: true,
        partner: { accountStatus: "ACTIVE", deletedAt: null },
      } : {}),
    },
    select: brandPageSelect,
  });
  if (!business || (guestView && (!business.logoUrl || !business.tagline))) {
    throw new BrandPageError(404, "Brand page not found");
  }
  return formatBrandPage(business);
};

export const saveBrandPage = async (
  businessId: string,
  input: BrandPageInput,
  images: BrandImages,
) => {
  const current = await prisma.businessDetails.findUniqueOrThrow({
    where: { id: businessId },
    select: { logoUrl: true },
  });
  if (!current.logoUrl && !images.logo) {
    throw new BrandPageError(400, "Upload a logo for your brand page");
  }

  const uploadedIds: string[] = [];
  const upload = async (image: BrandImage, kind: keyof BrandImages) => {
    const uploaded = await imagekit.upload({
      file: image.data,
      fileName: `${kind}-${randomUUID()}.${image.extension}`,
      folder: `/event-partner/brand-pages/${businessId}`,
    }).catch(() => {
      throw new BrandPageError(502, "Unable to upload the brand image");
    });
    if (uploaded.fileId) uploadedIds.push(uploaded.fileId);
    if (uploaded.fileType !== "image" || !uploaded.url ||
        !Number.isInteger(uploaded.width) || !Number.isInteger(uploaded.height) ||
        uploaded.width < 1 || uploaded.height < 1) {
      throw new BrandPageError(400, "Upload a valid JPEG or PNG image");
    }
    // if (kind === "logo" && (uploaded.width !== uploaded.height || uploaded.width < 400)) {
    //   throw new BrandPageError(400, "Logo must be square and at least 400 × 400 px");
    // }
    return uploaded.url;
  };

  try {
    const logoUrl = images.logo ? await upload(images.logo, "logo") : undefined;
    const coverPhotoUrl = images.coverPhoto
      ? await upload(images.coverPhoto, "coverPhoto")
      : input.removeCoverPhoto ? null : undefined;

    const business = await prisma.businessDetails.update({
      where: { id: businessId },
      data: {
        tagline: input.tagline,
        description: input.description === undefined ? undefined : input.description || null,
        instagramUrl: input.instagramUrl === undefined ? undefined : input.instagramUrl || null,
        website: input.website === undefined ? undefined : input.website || null,
        hostingSince: input.hostingSince === undefined ? undefined : input.hostingSince || null,
        logoUrl,
        coverPhotoUrl,
      },
      select: brandPageSelect,
    });
    return formatBrandPage(business);
  } catch (error) {
    await Promise.all(uploadedIds.map((id) => imagekit.deleteFile(id).catch(() => {
      console.error("Unable to delete an unsaved brand image");
    })));
    throw error;
  }
};
