import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";
import { UploadedFile } from "express-fileupload";

/**
 * Writes an in-memory uploaded video Buffer
 * to the operating system's temporary directory.
 *
 * Required because:
 * express-fileupload -> useTempFiles: false -> video.data
 * FFmpeg -> needs a physical file path
 */
export const createTemporaryVideo = async (
  video: UploadedFile
): Promise<string> => {
  const extension =
    path.extname(video.name) || ".mp4";

  const tempPath = path.join(
    os.tmpdir(),
    `video-verification-${crypto.randomUUID()}${extension}`
  );

  await fs.writeFile(
    tempPath,
    video.data
  );

  return tempPath;
};