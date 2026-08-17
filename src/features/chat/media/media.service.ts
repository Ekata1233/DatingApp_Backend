import { UploadedFile } from "express-fileupload";
import { mediaRepository } from "./media.repository";
import {
  MediaType,
  UploadMediaResponse,
} from "./media.types";

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB

const uploadMedia = async (
  file: UploadedFile,
  mediaType: MediaType
): Promise<UploadMediaResponse> => {
  if (!file) {
    throw new Error("File is required");
  }

  if (!["IMAGE", "VIDEO"].includes(mediaType)) {
    throw new Error("Invalid media type");
  }

  // IMAGE validation
  if (mediaType === "IMAGE") {
    if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(
        "Invalid image format. Allowed: JPG, PNG, WEBP, GIF"
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(
        "Image size cannot exceed 10 MB"
      );
    }
  }

  // VIDEO validation
  if (mediaType === "VIDEO") {
    if (!VIDEO_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(
        "Invalid video format. Allowed: MP4, WEBM, MOV"
      );
    }

    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error(
        "Video size cannot exceed 25 MB"
      );
    }
  }

  return mediaRepository.uploadToImageKit(
    file,
    mediaType
  );
};

export const mediaService = {
  uploadMedia,
};