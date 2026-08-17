import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import { mediaService } from "./media.service";
import { MediaType } from "./media.types";

export const uploadMedia = async (
  req: Request,
  res: Response
) => {
  try {
    /**
     * Get authenticated user
     */
    const userId = (req as any).user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    /**
     * Get uploaded file
     */
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const file = req.files.file as UploadedFile;

    /**
     * Get media type
     */
    const mediaType = req.body.mediaType as MediaType;

    if (!mediaType) {
      return res.status(400).json({
        success: false,
        message: "mediaType is required",
      });
    }

    /**
     * Upload media
     */
    const result = await mediaService.uploadMedia(
      file,
      mediaType
    );

    return res.status(200).json({
      success: true,
      message: "Media uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Media upload error:", error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Media upload failed",
    });
  }
};