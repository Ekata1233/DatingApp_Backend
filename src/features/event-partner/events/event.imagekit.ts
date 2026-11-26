
import { Request } from "express";
import { UploadedFile } from "express-fileupload";
import { randomUUID } from "crypto";

import imagekit from "../../../utils/imagekit";

import { EventServiceError } from "./event.types";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 40;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

interface UploadedImage {
  url: string;
  fileId: string;
}

interface ImageReference {
  target: Record<string, any> | any[];
  key: string | number;
  fileKey: string;
  folder: string;
  saveFileId?: boolean;
}

interface PreparedEventImages {
  payload: Record<string, any>;
  uploadedFileIds: string[];
}

// ======================================================
// PARSE JSON OR MULTIPART FORM DATA
// ======================================================

export const parseEventPayload = (
  req: Request
): Record<string, any> => {
  let payload: unknown;

  if (req.is("multipart/form-data")) {
    const body = req.body ?? {};

    console.log(
      "[EVENT PARSER] Multipart form-data detected"
    );

    // FORMAT 1: Single data JSON field
    if (body.data !== undefined) {
      if (typeof body.data !== "string") {
        throw new EventServiceError(
          "Event data must be a JSON string"
        );
      }

      if (
        Object.keys(body).some(
          (key) => key !== "data"
        )
      ) {
        throw new EventServiceError(
          "Do not mix data field with individual form-data fields"
        );
      }

      try {
        payload = JSON.parse(body.data);
      } catch {
        throw new EventServiceError(
          "Invalid event JSON data"
        );
      }
    } else {
      // FORMAT 2: Individual form-data fields

      console.log(
        "[EVENT PARSER] Individual form-data detected"
      );

      const parsedBody: Record<string, any> =
        Object.create(null);

      // JSON arrays and objects
      const jsonFields = new Set([
        "photos",
        "dates",
        "venue",
        "experience",
        "tripDetails",
        "included",
        "notIncluded",
        "whatToBring",
        "reminderTimes",
        "hostLanguages",
        "rules",
        "safetyOptions",
        "faqs",
        "completedSteps",
      ]);

      // Numeric fields
      const numberFields = new Set([
        "totalCapacity",

        "menCapacity",
        "womenCapacity",
        "otherCapacity",

        "menEntryPrice",
        "womenEntryPrice",
        "otherEntryPrice",

        "menDiscountPercentage",
        "womenDiscountPercentage",
        "otherDiscountPercentage",

        "coupleCapacity",
        "coupleEntryPrice",
        "coupleDiscountPercentage",

        "maxTicketsPerPerson",
        "minAge",
        "maxAge",
        "groupSize",
        "currentStep",
      ]);

      // Boolean fields
      const booleanFields = new Set([
        "waitlistEnabled",
      ]);

      for (const [key, rawValue] of Object.entries(body)) {
        // Prevent unsafe property names
        if (
          key === "__proto__" ||
          key === "constructor" ||
          key === "prototype"
        ) {
          throw new EventServiceError(
            `Invalid form-data field: ${key}`
          );
        }

        // Reject duplicate or invalid text fields
        if (typeof rawValue !== "string") {
          throw new EventServiceError(
            `Field '${key}' must contain a single text value`
          );
        }

        const value = rawValue.trim();

        // Parse JSON fields
        if (jsonFields.has(key)) {
          try {
            parsedBody[key] = JSON.parse(value);

            console.log(
              `[EVENT PARSER] JSON parsed: ${key}`
            );
          } catch {
            throw new EventServiceError(
              `Invalid JSON in field '${key}'`
            );
          }

          continue;
        }

        // Parse numeric fields
        if (numberFields.has(key)) {
          if (value === "null") {
            parsedBody[key] = null;
            continue;
          }

          if (!/^-?\d+(\.\d+)?$/.test(value)) {
            throw new EventServiceError(
              `Field '${key}' must be a valid number`
            );
          }

          const numericValue = Number(value);

          if (!Number.isFinite(numericValue)) {
            throw new EventServiceError(
              `Invalid number in field '${key}'`
            );
          }

          parsedBody[key] = numericValue;

          continue;
        }

        // Parse boolean fields
        if (booleanFields.has(key)) {
          if (value === "true") {
            parsedBody[key] = true;
          } else if (value === "false") {
            parsedBody[key] = false;
          } else {
            throw new EventServiceError(
              `Field '${key}' must be true or false`
            );
          }

          continue;
        }

        // Parse string and nullable fields
        parsedBody[key] =
          value === "null" ? null : value;
      }

      payload = parsedBody;
    }
  } else {
    // FORMAT 3: Raw JSON
    payload = req.body;
  }

  // Final payload check
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new EventServiceError(
      "Invalid event request body"
    );
  }

  console.log(
    "[EVENT PARSER] Payload parsed successfully"
  );

  console.log(
    "[EVENT PARSER] Total fields:",
    Object.keys(payload).length
  );

  return payload as Record<string, any>;
};

// ======================================================
// VALIDATE IMAGE
// ======================================================

const validateImage = (
  image: UploadedFile
) => {
  if (image.truncated) {
    throw new EventServiceError(
      "Image exceeds the allowed upload size"
    );
  }

  if (
    !ALLOWED_MIME_TYPES.includes(image.mimetype)
  ) {
    throw new EventServiceError(
      "Only jpg, jpeg, png, webp and gif are allowed"
    );
  }

  if (image.size > MAX_IMAGE_SIZE) {
    throw new EventServiceError(
      "Image size must not exceed 5 MB"
    );
  }

  if (image.size <= 0) {
    throw new EventServiceError(
      "Empty image files are not allowed"
    );
  }
};

// ======================================================
// GET IMAGE FILE FROM REQUEST
// ======================================================

const getImageFile = (
  req: Request,
  fileKey: string
): UploadedFile => {
  const file = req.files?.[fileKey];

  if (!file) {
    throw new EventServiceError(
      `Image file '${fileKey}' is required`
    );
  }

  if (Array.isArray(file)) {
    throw new EventServiceError(
      `Only one image is allowed for '${fileKey}'`
    );
  }

  validateImage(file);

  return file;
};

// ======================================================
// UPLOAD SINGLE IMAGE TO IMAGEKIT
// ======================================================

const uploadEventImage = async (
  image: UploadedFile,
  folder: string
): Promise<UploadedImage> => {
  const safeName = image.name.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  const uploadResponse = await imagekit.upload({
    file: image.tempFilePath
      ? await import("fs/promises").then(
          (fs) => fs.readFile(image.tempFilePath)
        )
      : image.data,

    fileName: `${Date.now()}-${randomUUID()}-${safeName}`,

    folder,

    useUniqueFileName: true,
  });

  return {
    url: uploadResponse.url,
    fileId: uploadResponse.fileId,
  };
};

// ======================================================
// CLEANUP NEWLY UPLOADED IMAGES
// ======================================================

export const cleanupEventImages = async (
  fileIds: string[]
) => {
  const uniqueIds = [...new Set(fileIds)];

  await Promise.allSettled(
    uniqueIds.map(async (fileId) => {
      try {
        await imagekit.deleteFile(fileId);
      } catch (error) {
        console.error(
          "Event ImageKit cleanup failed:",
          fileId,
          error
        );
      }
    })
  );
};

// ======================================================
// COLLECT IMAGE REFERENCES
// ======================================================

const collectImageReferences = (
  payload: Record<string, any>
): ImageReference[] => {
  const references: ImageReference[] = [];

  const addReference = (
    target: Record<string, any> | any[],
    key: string | number,
    folder: string,
    saveFileId = false
  ) => {
    if (!target || typeof target !== "object") {
      return;
    }

    const value = (target as any)[key];

    // Existing ImageKit URLs are preserved.
    // Only upload: references require new uploads.
    if (
      typeof value !== "string" ||
      !value.startsWith("upload:")
    ) {
      return;
    }

    const fileKey = value.slice("upload:".length);

    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(fileKey)) {
      throw new EventServiceError(
        "Invalid image upload reference"
      );
    }

    references.push({
      target,
      key,
      fileKey,
      folder,
      saveFileId,
    });
  };

  const addArrayReferences = (
    images: unknown,
    folder: string
  ) => {
    if (!Array.isArray(images)) return;

    images.forEach((_, index) => {
      addReference(images, index, folder);
    });
  };

  // ================= EVENT PHOTOS =================

  if (Array.isArray(payload.photos)) {
    for (const photo of payload.photos) {
      if (!photo || typeof photo !== "object") {
        continue;
      }

      const folder =
        photo.photoType === "HIGHLIGHT"
          ? "highlights"
          : "photos";

      addReference(
        photo,
        "photoUrl",
        folder,
        true
      );
    }
  }

  // ================= VENUE PHOTO =================

  if (payload.venue) {
    addReference(
      payload.venue,
      "photoUrl",
      "venue"
    );
  }

  // ================= EXPERIENCE PHOTOS =================

  if (Array.isArray(payload.experience)) {
    for (const experience of payload.experience) {
      addReference(
        experience,
        "photoUrl",
        "experience"
      );
    }
  }

  // ================= HOST PHOTO =================

  addReference(
    payload,
    "hostPhotoUrl",
    "host"
  );

  // ================= MULTI DAY TRIP =================

  const trip = payload.tripDetails;

  if (trip && typeof trip === "object") {
    // Vehicle photos
    addArrayReferences(
      trip.vehiclePhotos,
      "trip/vehicle"
    );

    // Trip days
    if (Array.isArray(trip.days)) {
      for (const day of trip.days) {
        if (!day || typeof day !== "object") {
          continue;
        }

        addReference(
          day,
          "photoUrl",
          "trip/days"
        );

        addArrayReferences(
          day.highlightPhotos,
          "trip/day-highlights"
        );

        // Trip stops
        if (Array.isArray(day.stops)) {
          for (const stop of day.stops) {
            addReference(
              stop,
              "photoUrl",
              "trip/stops"
            );
          }
        }
      }
    }

    // Trip stay photos
    if (Array.isArray(trip.stays)) {
      for (const stay of trip.stays) {
        addArrayReferences(
          stay?.photos,
          "trip/stays"
        );
      }
    }

    // Trip place photos
    if (Array.isArray(trip.places)) {
      for (const place of trip.places) {
        addReference(
          place,
          "photoUrl",
          "trip/places"
        );
      }
    }
  }

  return references;
};

// ======================================================
// PREPARE EVENT IMAGES
// ======================================================

export const prepareEventImages = async (
  req: Request,
  businessId: string,
  payload: Record<string, any>,
  validatePayload: (
    payload: Record<string, any>
  ) => unknown
): Promise<PreparedEventImages> => {
  const uploadedFileIds: string[] = [];

  const uploadedImages = new Map<
    string,
    UploadedImage
  >();

  const references = collectImageReferences(payload);

  const fileKeys = new Set(
    references.map((reference) => reference.fileKey)
  );
console.log("[IMAGEKIT] Received file keys:", 
  Object.keys(req.files ?? {})
);

console.log("[IMAGEKIT] Expected file keys:", 
  [...fileKeys]
);

console.log("[IMAGEKIT] Unexpected file keys:",
  Object.keys(req.files ?? {}).filter(
    (key) => !fileKeys.has(key)
  )
);

console.log("[IMAGEKIT] Missing file keys:",
  [...fileKeys].filter(
    (key) => !req.files?.[key]
  )
);
  if (fileKeys.size > MAX_IMAGES) {
    throw new EventServiceError(
      `Maximum ${MAX_IMAGES} images are allowed per request`
    );
  }

  // Reject unused files.
  for (const key of Object.keys(req.files ?? {})) {
    if (!fileKeys.has(key)) {
      throw new EventServiceError(
        `Unexpected image file: ${key}`
      );
    }
  }

  // Validate every file before uploading anything.
  for (const fileKey of fileKeys) {
    getImageFile(req, fileKey);
  }

  // Validate event JSON before uploading.
  // Temporarily replace upload references with valid URLs.
  for (const reference of references) {
    (reference.target as any)[reference.key] =
      `https://placeholder.invalid/${reference.fileKey}`;
  }

  validatePayload(payload);

  try {
    for (const reference of references) {
      let uploaded = uploadedImages.get(
        reference.fileKey
      );

      // Reuse upload if the same file is referenced twice.
      if (!uploaded) {
        const image = getImageFile(
          req,
          reference.fileKey
        );

        uploaded = await uploadEventImage(
          image,
          `/events/${businessId}/${reference.folder}`
        );

        uploadedImages.set(
          reference.fileKey,
          uploaded
        );

        uploadedFileIds.push(uploaded.fileId);
      }

      // Replace temporary reference with ImageKit URL.
      (reference.target as any)[reference.key] =
        uploaded.url;

      // EventPhoto model supports fileId.
      if (reference.saveFileId) {
        (reference.target as any).fileId =
          uploaded.fileId;
      }
    }

    return {
      payload,
      uploadedFileIds,
    };
  } catch (error) {
    // No database operation has started yet.
    await cleanupEventImages(uploadedFileIds);

    throw error;
  }
};
