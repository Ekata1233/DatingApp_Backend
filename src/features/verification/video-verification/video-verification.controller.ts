import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import { verifyVideoLivenessService } from "./video-verification.service";
import { createTemporaryVideo } from "../../../utils/video-upload.util";

export const verifyVideoLivenessController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // Consent
    if (req.body.consent !== "Y") {
      return res.status(400).json({
        success: false,
        message: "User consent is required.",
      });
    }

    // express-fileupload
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: "Verification video is required.",
      });
    }

    // Prevent multiple files
    if (Array.isArray(req.files.video)) {
      return res.status(400).json({
        success: false,
        message: "Only one verification video is allowed.",
      });
    }

    const video =
      req.files?.video as UploadedFile;

    if (!video) {
      return res.status(400).json({
        success: false,
        message: "Verification video is required.",
      });
    }

    console.log("VIDEO:", {
      name: video.name,
      size: video.size,
      mimetype: video.mimetype,
    });

    // Write ONLY this video to temp disk
    const videoPath =
      await createTemporaryVideo(video);

    console.log(
      "TEMP VIDEO PATH:",
      videoPath
    );

    const result =
      await verifyVideoLivenessService({
        userId,
        videoPath,
      });

    return res.status(200).json({
      success: true,
      message:
        "Video verification completed successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};