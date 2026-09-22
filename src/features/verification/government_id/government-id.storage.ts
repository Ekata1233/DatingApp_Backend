import { randomUUID } from "crypto";
import axios from "axios";

import imagekit from "../../../utils/imagekit";

const GOVERNMENT_ID_FOLDER = "/government-id";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface GovernmentIdPhoto {
  buffer: Buffer;
  mimeType: "image/jpeg" | "image/png";
}

const detectImageType = (
  buffer: Buffer
): GovernmentIdPhoto["mimeType"] => {
  if (
    buffer.length >= 3 &&
    buffer.subarray(0, 3).equals(
      Buffer.from([0xff, 0xd8, 0xff])
    )
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
      ])
    )
  ) {
    return "image/png";
  }

  throw new Error("INVALID_GOVERNMENT_ID_IMAGE");
};

const validateImage = (
  buffer: Buffer
): GovernmentIdPhoto["mimeType"] => {
  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length === 0 ||
    buffer.length > MAX_IMAGE_BYTES
  ) {
    throw new Error("INVALID_GOVERNMENT_ID_IMAGE_SIZE");
  }

  return detectImageType(buffer);
};

// --------------------------------------------
// Upload Government ID portrait
// --------------------------------------------

export const uploadGovernmentIdPhoto = async (
  userId: string,
  photoBuffer: Buffer
): Promise<string> => {
  const mimeType = validateImage(photoBuffer);

  const extension =
    mimeType === "image/png" ? "png" : "jpg";

  const uploaded = await imagekit.upload({
    file: photoBuffer,

    fileName: `${randomUUID()}.${extension}`,

    folder: `${GOVERNMENT_ID_FOLDER}/${userId}`,

    useUniqueFileName: true,

    isPrivateFile: true,

    tags: ["government-id", "kyc"],
  });

  if (!uploaded.fileId) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_UPLOAD_FAILED"
    );
  }

  // Store the ImageKit file ID in Prisma.
  // Do not store the public delivery URL.

  return uploaded.fileId;
};

// --------------------------------------------
// Retrieve Government ID portrait
// --------------------------------------------

export const getGovernmentIdPhoto = async (
  photoKey: string
): Promise<GovernmentIdPhoto> => {
  if (!photoKey) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_KEY_REQUIRED"
    );
  }

  // photoKey is the ImageKit file ID.
  const file = await imagekit.getFileDetails(photoKey);

  if (
    !file ||
    !file.filePath ||
    file.isPrivateFile !== true
  ) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_NOT_AVAILABLE"
    );
  }

  // Only allow images from the dedicated KYC folder.
  if (
    !file.filePath.startsWith(
      `${GOVERNMENT_ID_FOLDER}/`
    )
  ) {
    throw new Error(
      "INVALID_GOVERNMENT_ID_PHOTO_PATH"
    );
  }

  // Generate a short-lived signed URL server-side.
  const signedUrl = imagekit.url({
    path: file.filePath,

    signed: true,

    expireSeconds: 60,
  });

  const response = await axios.get<ArrayBuffer>(
    signedUrl,
    {
      responseType: "arraybuffer",

      timeout: 15000,

      maxContentLength: MAX_IMAGE_BYTES,

      maxBodyLength: MAX_IMAGE_BYTES,

      maxRedirects: 0,
    }
  );

  const buffer = Buffer.from(response.data);

  const mimeType = validateImage(buffer);

  return {
    buffer,
    mimeType,
  };
};