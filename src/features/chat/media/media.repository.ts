import { UploadedFile } from "express-fileupload";
import imagekit from "../../../utils/imagekit";
import {
  MediaType,
  UploadMediaResponse,
} from "./media.types";

const uploadToImageKit = async (
  file: UploadedFile,
  mediaType: MediaType
): Promise<UploadMediaResponse> => {
  if (!file) {
    throw new Error("File is required");
  }

  const uploadedFile = await imagekit.upload({
    file: file.data,
    fileName: file.name,
    folder: `/dating-app/chat/${mediaType.toLowerCase()}`,
    useUniqueFileName: true,
  });

  return {
    url: uploadedFile.url,
    fileId: uploadedFile.fileId,
    fileName: uploadedFile.name,
    fileType: mediaType,
    mimeType: file.mimetype,
    size: file.size,
    thumbnailUrl: uploadedFile.thumbnailUrl,
  };
};

export const mediaRepository = {
  uploadToImageKit,
};