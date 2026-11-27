import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import imagekit from "../../../utils/imagekit";
import { VenueInput } from "./venue.validation";

const venueSelect = {
  id: true,
  businessId: true,
  venueName: true,
  fullAddress: true,
  venueCapacity: true,
  venueType: true,
  arrangement: true,
  nocDocumentName: true,
  isActive: true,
  photos: {
    orderBy: { sortOrder: "asc" },
    select: { id: true, photoUrl: true, sortOrder: true },
  },
} satisfies Prisma.OrganizerVenueSelect;

export const listOrganizerVenues = (businessId: string) =>
  prisma.organizerVenue.findMany({
    where: { businessId, isDeleted: false },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: venueSelect,
  });

export type VenueUpload = {
  bytes: Buffer;
  extension: "jpg" | "png" | "pdf";
};

export const deleteOrganizerVenue = async (businessId: string, venueId: string) => {
  const where = { id: venueId, businessId };
  const deleted = await prisma.organizerVenue.updateMany({
    where: {
      ...where,
      isDeleted: false,
      events: {
        none: {
          isDeleted: false,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
      },
    },
    data: { isDeleted: true, isActive: false, deletedAt: new Date() },
  });
  if (deleted.count) return "DELETED";

  const venue = await prisma.organizerVenue.findFirst({ where, select: { isDeleted: true } });
  if (!venue) return "NOT_FOUND";
  return venue.isDeleted ? "DELETED" : "IN_USE";
};

export class VenueUploadError extends Error {}

export const addOrganizerVenue = async (
  businessId: string,
  input: VenueInput,
  photos: VenueUpload[],
  noc?: VenueUpload & { originalName: string },
) => {
  const uploadedIds: string[] = [];
  const upload = async (file: VenueUpload, isPrivateFile: boolean) => {
    const uploaded = await imagekit.upload({
      file: file.bytes,
      fileName: `${randomUUID()}.${file.extension}`,
      folder: `/event-partner/venues/${businessId}`,
      isPrivateFile,
    }).catch(() => {
      throw new VenueUploadError("Unable to upload venue files");
    });
    if (!uploaded.fileId) throw new VenueUploadError("Unable to upload venue files");
    uploadedIds.push(uploaded.fileId);
    if (!isPrivateFile && !uploaded.url) throw new VenueUploadError("Unable to upload venue photos");
    return uploaded;
  };

  try {
    const document = noc ? await upload(noc, true) : undefined;
    const photoRows = [];
    for (const [sortOrder, photo] of photos.entries()) {
      const uploaded = await upload(photo, false);
      photoRows.push({ photoUrl: uploaded.url, fileId: uploaded.fileId, sortOrder });
    }

    return await prisma.organizerVenue.create({
      data: {
        businessId,
        ...input,
        nocDocumentKey: document?.fileId,
        nocDocumentName: noc?.originalName,
        photos: { create: photoRows },
      },
      select: venueSelect,
    });
  } catch (error) {
    await Promise.all(uploadedIds.map((id) => imagekit.deleteFile(id).catch(() => {
      console.error("Unable to delete an unsaved venue upload");
    })));
    throw error;
  }
};
