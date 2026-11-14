
import { prisma } from "../../../../prisma/prismaClient";
import imagekit from "../../../../utils/imagekit";

import {
  CreatePackageProgramInput,
  UpdatePackageProgramInput,
  PackageProgramFilters,
  PackageProgramDestinationInput,
  UploadedPackageProgramImage,
} from "./packagePrograms.types";

// ==========================================
// CUSTOM ERROR
// ==========================================

export class PackageProgramError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "PackageProgramError";
  }
}

// ==========================================
// DELETE IMAGE FROM IMAGEKIT
// ==========================================

const deleteImageFromImageKit = async (
  fileId: string
) => {
  if (!fileId) return;

  await imagekit.deleteFile(fileId);
};

// ==========================================
// CLEANUP OLD IMAGES
// ==========================================

const cleanupOldImages = async (
  fileIds: string[]
) => {
  const results = await Promise.allSettled(
    [...new Set(fileIds.filter(Boolean))].map(
      (fileId) => deleteImageFromImageKit(fileId)
    )
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "ImageKit deletion failed:",
        result.reason
      );
    }
  });
};

// ==========================================
// VALIDATE DESTINATION IMAGE MAPPING
// ==========================================

const validateUploadedImageMapping = (
  destinations: PackageProgramDestinationInput[],
  uploadedImages: UploadedPackageProgramImage[],
  isCreate: boolean
) => {
  const indices: number[] = [];

  for (const destination of destinations) {
    if (
      typeof destination.city !== "string" ||
      !destination.city.trim()
    ) {
      throw new PackageProgramError(
        "Destination city is required"
      );
    }

    if (isCreate && destination.id) {
      throw new PackageProgramError(
        "Destination ID is not allowed while creating"
      );
    }

    if (
      !destination.id &&
      destination.imageIndex === undefined
    ) {
      throw new PackageProgramError(
        `Image is required for ${destination.city}`
      );
    }

    if (destination.imageIndex !== undefined) {
      const index = destination.imageIndex;

      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= uploadedImages.length
      ) {
        throw new PackageProgramError(
          `Invalid imageIndex for ${destination.city}`
        );
      }

      indices.push(index);
    }
  }

  if (
    indices.length !== uploadedImages.length ||
    new Set(indices).size !== uploadedImages.length
  ) {
    throw new PackageProgramError(
      "Every uploaded image must belong to exactly one destination"
    );
  }
};

// ==========================================
// GET PACKAGE PROGRAM BY ID
// ==========================================

export const getPackageProgramByIdService = async (
  id: string
) => {
  const program = await prisma.packagePrograms.findUnique({
    where: { id },
    include: {
      destinations: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!program) {
    throw new PackageProgramError(
      "Package program not found",
      404
    );
  }

  return program;
};

// ==========================================
// VALIDATE UPDATE BEFORE IMAGE UPLOAD
// ==========================================

export const validatePackageProgramUpdate = async (
  id: string,
  destinations?: PackageProgramDestinationInput[]
) => {
  const existing = await getPackageProgramByIdService(id);

  if (destinations === undefined) {
    return existing;
  }

  const existingIds = new Set(
    existing.destinations.map((destination) => destination.id)
  );

  const submittedIds = destinations
    .map((destination) => destination.id)
    .filter((value): value is string => !!value);

  if (
    new Set(submittedIds).size !== submittedIds.length
  ) {
    throw new PackageProgramError(
      "Duplicate destination IDs"
    );
  }

  for (const destination of destinations) {
    if (
      destination.id &&
      !existingIds.has(destination.id)
    ) {
      throw new PackageProgramError(
        "Destination does not belong to this program"
      );
    }
  }

  return existing;
};

// ==========================================
// CREATE PACKAGE PROGRAM
// ==========================================

export const createPackageProgramService = async (
  payload: CreatePackageProgramInput,
  uploadedImages: UploadedPackageProgramImage[] = []
) => {
  const destinations = payload.destinations ?? [];

  validateUploadedImageMapping(
    destinations,
    uploadedImages,
    true
  );

  return prisma.packagePrograms.create({
    data: {
      packageType: payload.packageType,
      title: payload.title,
      tagline: payload.tagline,
      description: payload.description,
      tags: payload.tags ?? [],
      condition: payload.condition,
      isActive: payload.isActive ?? true,
      sortOrder: payload.sortOrder ?? 0,

      destinations: {
        create: destinations.map((destination) => {
          const image =
            uploadedImages[destination.imageIndex!];

          return {
            city: destination.city,
            imageUrl: image.imageUrl,
            imageFileId: image.imageFileId,
            sortOrder: destination.sortOrder ?? 0,
            isActive: destination.isActive ?? true,
          };
        }),
      },
    },
    include: {
      destinations: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
};

// ==========================================
// GET ALL PACKAGE PROGRAMS
// ==========================================

export const getAllPackageProgramsService = async (
  filters: PackageProgramFilters = {}
) => {
  return prisma.packagePrograms.findMany({
    where: {
      ...(filters.packageType && {
        packageType: filters.packageType,
      }),

      ...(filters.isActive !== undefined && {
        isActive: filters.isActive,
      }),
    },

    include: {
      destinations: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },

    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });
};

// ==========================================
// UPDATE PACKAGE PROGRAM
// ==========================================

export const updatePackageProgramService = async (
  id: string,
  payload: UpdatePackageProgramInput,
  uploadedImages: UploadedPackageProgramImage[] = []
) => {
  const existing = await validatePackageProgramUpdate(
    id,
    payload.destinations
  );

  const destinations = payload.destinations;

  if (
    destinations === undefined &&
    uploadedImages.length > 0
  ) {
    throw new PackageProgramError(
      "Destinations are required when uploading images"
    );
  }

  if (destinations !== undefined) {
    validateUploadedImageMapping(
      destinations,
      uploadedImages,
      false
    );
  }

  const imagesToDelete: string[] = [];

  // ==========================================
  // DATABASE TRANSACTION
  // ==========================================

  const updatedProgram = await prisma.$transaction(
    async (tx) => {
      await tx.packagePrograms.update({
        where: { id },

        data: {
          ...(payload.packageType !== undefined && {
            packageType: payload.packageType,
          }),

          ...(payload.title !== undefined && {
            title: payload.title,
          }),

          ...(payload.tagline !== undefined && {
            tagline: payload.tagline,
          }),

          ...(payload.description !== undefined && {
            description: payload.description,
          }),

          ...(payload.tags !== undefined && {
            tags: payload.tags,
          }),

          ...(payload.condition !== undefined && {
            condition: payload.condition,
          }),

          ...(payload.isActive !== undefined && {
            isActive: payload.isActive,
          }),

          ...(payload.sortOrder !== undefined && {
            sortOrder: payload.sortOrder,
          }),
        },
      });

      // ==========================================
      // UPDATE DESTINATIONS
      // ==========================================

      if (destinations !== undefined) {
        const keepIds = destinations
          .map((destination) => destination.id)
          .filter((value): value is string => !!value);

        // Destinations not submitted will be removed
        const removedDestinations =
          existing.destinations.filter(
            (destination) =>
              !keepIds.includes(destination.id)
          );

        imagesToDelete.push(
          ...removedDestinations.map(
            (destination) => destination.imageFileId
          )
        );

        await tx.packageProgramDestination.deleteMany({
          where: {
            programId: id,
            id: {
              notIn: keepIds,
            },
          },
        });

        for (const destination of destinations) {
          const image =
            destination.imageIndex !== undefined
              ? uploadedImages[destination.imageIndex]
              : undefined;

          // ======================================
          // UPDATE EXISTING DESTINATION
          // ======================================

          if (destination.id) {
            const oldDestination =
              existing.destinations.find(
                (item) => item.id === destination.id
              )!;

            await tx.packageProgramDestination.update({
              where: {
                id: destination.id,
              },

              data: {
                city: destination.city,
                sortOrder: destination.sortOrder ?? 0,
                isActive: destination.isActive ?? true,

                ...(image && {
                  imageUrl: image.imageUrl,
                  imageFileId: image.imageFileId,
                }),
              },
            });

            // Delete old image only when replaced
            if (image) {
              imagesToDelete.push(
                oldDestination.imageFileId
              );
            }
          } else {
            // ====================================
            // CREATE NEW DESTINATION
            // ====================================

            if (!image) {
              throw new PackageProgramError(
                `Image is required for ${destination.city}`
              );
            }

            await tx.packageProgramDestination.create({
              data: {
                programId: id,
                city: destination.city,
                imageUrl: image.imageUrl,
                imageFileId: image.imageFileId,
                sortOrder: destination.sortOrder ?? 0,
                isActive: destination.isActive ?? true,
              },
            });
          }
        }
      }

      return tx.packagePrograms.findUniqueOrThrow({
        where: { id },
        include: {
          destinations: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });
    }
  );

  // ==========================================
  // DELETE OLD IMAGES AFTER DB COMMIT
  // ==========================================

  await cleanupOldImages(imagesToDelete);

  return updatedProgram;
};

// ==========================================
// DELETE PACKAGE PROGRAM
// ==========================================

export const deletePackageProgramService = async (
  id: string
) => {
  const existing = await getPackageProgramByIdService(id);

  // Delete program and cascading destinations
  await prisma.packagePrograms.delete({
    where: { id },
  });

  // Delete associated ImageKit files
  await cleanupOldImages(
    existing.destinations.map(
      (destination) => destination.imageFileId
    )
  );

  return {
    id,
    deleted: true,
  };
};
