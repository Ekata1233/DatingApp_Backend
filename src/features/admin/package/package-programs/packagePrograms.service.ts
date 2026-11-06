import { randomUUID } from "crypto";
import { PackageType } from "@prisma/client";


import {
  CreatePackageProgramInput,
  UpdatePackageProgramInput,
  PackageProgramFilters,
  PackageProgramDestinationInput,
  UploadedPackageProgramImage,
} from "./packagePrograms.types";
import imagekit from "../../../../utils/imagekit";
import { prisma } from "../../../../prisma/prismaClient";

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
// IMAGE VALIDATION
// ==========================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 20;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const validateImages = (
  files: Express.Multer.File[]
) => {
  if (files.length > MAX_IMAGES) {
    throw new PackageProgramError(
      "Maximum 20 images are allowed"
    );
  }

  for (const file of files) {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new PackageProgramError(
        `${file.originalname} must be less than 5 MB`
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new PackageProgramError(
        `${file.originalname} must be JPG, PNG or WEBP`
      );
    }

    if (!file.buffer) {
      throw new PackageProgramError(
        "Image buffer is missing"
      );
    }
  }
};

// ==========================================
// VALIDATE DESTINATION IMAGE MAPPING
// ==========================================

const validateDestinationImages = (
  destinations: PackageProgramDestinationInput[],
  files: Express.Multer.File[],
  isCreate: boolean
) => {
  const indices: number[] = [];

  for (const destination of destinations) {
    if (!destination.city?.trim()) {
      throw new PackageProgramError(
        "Destination city is required"
      );
    }

    if (isCreate && destination.id) {
      throw new PackageProgramError(
        "Destination ID is not allowed while creating"
      );
    }

    if (!destination.id && destination.imageIndex === undefined) {
      throw new PackageProgramError(
        `Image is required for ${destination.city}`
      );
    }

    if (destination.imageIndex !== undefined) {
      if (
        !Number.isInteger(destination.imageIndex) ||
        destination.imageIndex < 0 ||
        destination.imageIndex >= files.length
      ) {
        throw new PackageProgramError(
          `Invalid imageIndex for ${destination.city}`
        );
      }

      indices.push(destination.imageIndex);
    }
  }

  if (
    indices.length !== files.length ||
    new Set(indices).size !== files.length
  ) {
    throw new PackageProgramError(
      "Every uploaded image must belong to exactly one destination"
    );
  }
};

// ==========================================
// UPLOAD IMAGE TO IMAGEKIT
// ==========================================

const uploadImageToImageKit = async (
  file: Express.Multer.File
): Promise<UploadedPackageProgramImage> => {
  const uploadResponse = await imagekit.upload({
    file: file.buffer,
    fileName: `${Date.now()}-${randomUUID()}-${file.originalname}`,
    folder: "/package-programs",
  });

  return {
    imageUrl: uploadResponse.url,
    imageFileId: uploadResponse.fileId,
  };
};

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
// CLEANUP IMAGES
// ==========================================

const cleanupImages = async (
  images: UploadedPackageProgramImage[]
) => {
  const results = await Promise.allSettled(
    images.map((image) =>
      deleteImageFromImageKit(image.imageFileId)
    )
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "ImageKit cleanup failed:",
        result.reason
      );
    }
  });
};

// ==========================================
// UPLOAD MULTIPLE IMAGES
// ==========================================

const uploadMultipleImages = async (
  files: Express.Multer.File[]
): Promise<UploadedPackageProgramImage[]> => {
  validateImages(files);

  const uploaded: UploadedPackageProgramImage[] = [];

  try {
    for (const file of files) {
      const result = await uploadImageToImageKit(file);
      uploaded.push(result);
    }

    return uploaded;
  } catch (error) {
    await cleanupImages(uploaded);
    throw error;
  }
};

// ==========================================
// CREATE PACKAGE PROGRAM
// ==========================================

export const createPackageProgramService = async (
  payload: CreatePackageProgramInput,
  files: Express.Multer.File[] = []
) => {
  const destinations = payload.destinations ?? [];

  validateImages(files);
  validateDestinationImages(destinations, files, true);

  const uploadedImages = await uploadMultipleImages(files);

  try {
    const program = await prisma.packagePrograms.create({
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

    return program;
  } catch (error) {
    await cleanupImages(uploadedImages);
    throw error;
  }
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
// UPDATE PACKAGE PROGRAM
// ==========================================

export const updatePackageProgramService = async (
  id: string,
  payload: UpdatePackageProgramInput,
  files: Express.Multer.File[] = []
) => {
  const existing = await getPackageProgramByIdService(id);

  const destinations = payload.destinations;

  if (destinations === undefined && files.length > 0) {
    throw new PackageProgramError(
      "Destinations are required when uploading images"
    );
  }

  if (destinations !== undefined) {
    validateImages(files);

    validateDestinationImages(
      destinations,
      files,
      false
    );

    const existingIds = new Set(
      existing.destinations.map((d) => d.id)
    );

    const submittedIds = destinations
      .map((d) => d.id)
      .filter((id): id is string => !!id);

    if (new Set(submittedIds).size !== submittedIds.length) {
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
  }

  const uploadedImages = await uploadMultipleImages(files);

  const imagesToDelete: string[] = [];

  try {
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

        if (destinations !== undefined) {
          const keepIds = destinations
            .map((d) => d.id)
            .filter((id): id is string => !!id);

          const removedDestinations =
            existing.destinations.filter(
              (d) => !keepIds.includes(d.id)
            );

          imagesToDelete.push(
            ...removedDestinations.map(
              (d) => d.imageFileId
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

            if (destination.id) {
              const oldDestination =
                existing.destinations.find(
                  (d) => d.id === destination.id
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

              if (image) {
                imagesToDelete.push(
                  oldDestination.imageFileId
                );
              }
            } else {
              await tx.packageProgramDestination.create({
                data: {
                  programId: id,
                  city: destination.city,
                  imageUrl: image!.imageUrl,
                  imageFileId: image!.imageFileId,
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

    // Remove replaced/deleted images after DB commit
    const results = await Promise.allSettled(
      imagesToDelete.map((fileId) =>
        deleteImageFromImageKit(fileId)
      )
    );

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error(
          "Old ImageKit image deletion failed:",
          result.reason
        );
      }
    });

    return updatedProgram;
  } catch (error) {
    await cleanupImages(uploadedImages);
    throw error;
  }
};

// ==========================================
// DELETE PACKAGE PROGRAM
// ==========================================

export const deletePackageProgramService = async (
  id: string
) => {
  const existing = await getPackageProgramByIdService(id);

  await prisma.packagePrograms.delete({
    where: { id },
  });

  const results = await Promise.allSettled(
    existing.destinations.map((destination) =>
      deleteImageFromImageKit(destination.imageFileId)
    )
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "ImageKit image deletion failed:",
        result.reason
      );
    }
  });

  return {
    id,
    deleted: true,
  };
};