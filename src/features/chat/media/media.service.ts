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

const AUDIO_MIME_TYPES = [
  "audio/mpeg",      // MP3
  "audio/mp4",       // M4A
  "audio/x-m4a",     // M4A
  "audio/aac",       // AAC
  "audio/wav",       // WAV
  "audio/x-wav",     // WAV
  "audio/ogg",       // OGG
  "audio/webm",      // WebM audio
];

const FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB

const uploadMedia = async (
  file: UploadedFile,
  mediaType: MediaType
): Promise<UploadMediaResponse> => {
  if (!file) {
    throw new Error("File is required");
  }

  if (!["IMAGE", "VIDEO", "AUDIO", "FILE"].includes(mediaType)) {
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

  // AUDIO validation
  if (mediaType === "AUDIO") {
    if (!AUDIO_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(
        "Invalid audio format. Allowed: MP3, M4A, AAC, WAV, OGG, WEBM"
      );
    }

    if (file.size > MAX_AUDIO_SIZE) {
      throw new Error(
        "Audio size cannot exceed 10 MB"
      );
    }
  }

  if (mediaType === "FILE") {
    if (!FILE_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(
        "Invalid file format. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP"
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        "File size cannot exceed 20 MB"
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