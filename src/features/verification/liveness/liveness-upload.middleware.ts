
import multer from "multer";

const MAX_FILE_SIZE = 3 * 1024 * 1024;

export const livenessUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter: (req, file, callback) => {

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("INVALID_SELFIE_FORMAT")
      );
    }

    callback(null, true);
  },
});