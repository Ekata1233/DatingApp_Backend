import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface ExtractedFrame {
  path: string;
  base64: string;
}


const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

console.log("FFMPEG PATH:", ffmpegInstaller.path);
console.log("FFPROBE PATH:", ffprobeInstaller.path);
export const extractVerificationFrames = async (
  videoPath: string
): Promise<ExtractedFrame[]> => {
  const tempDir = path.join(
    process.cwd(),
    "tmp",
    `liveness-${crypto.randomUUID()}`
  );

  await fs.mkdir(tempDir, {
    recursive: true,
  });

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on("end", async () => {
        try {
          const files = await fs.readdir(tempDir);

          const imageFiles = files
            .filter((file) => file.endsWith(".jpg"))
            .sort();

          const frames: ExtractedFrame[] = [];

          for (const file of imageFiles) {
            const framePath = path.join(tempDir, file);

            const buffer = await fs.readFile(framePath);

            frames.push({
              path: framePath,
              base64: buffer.toString("base64"),
            });
          }

          resolve(frames);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", reject)
      .screenshots({
        timestamps: ["35%", "65%"],
        filename: "frame-%i.jpg",
        folder: tempDir,
        size: "720x?",
      });
  });
};

export const cleanupVerificationFiles = async (
  videoPath: string,
  frames: ExtractedFrame[]
) => {
  try {
    await fs.unlink(videoPath).catch(() => {});

    for (const frame of frames) {
      await fs.unlink(frame.path).catch(() => {});
    }

    if (frames.length > 0) {
      await fs
        .rm(path.dirname(frames[0].path), {
          recursive: true,
          force: true,
        })
        .catch(() => {});
    }
  } catch (error) {
    console.error("Verification cleanup error:", error);
  }
};