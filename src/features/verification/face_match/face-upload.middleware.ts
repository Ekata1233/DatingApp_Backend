
import multer from "multer";

const MAX_IMAGE_SIZE = 6 * 1024 * 1024;

export const faceUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },

  fileFilter: (req, file, callback) => {

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("INVALID_SELFIE_IMAGE_TYPE")
      );
    }

    callback(null, true);
  },
});