import multer from "multer";

const storage = multer.memoryStorage();

export const uploadMediaMiddleware =
  multer({
    storage,

    limits: {
      fileSize: 25 * 1024 * 1024, // 100 MB
    },
  });