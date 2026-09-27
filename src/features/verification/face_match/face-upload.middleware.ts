// import multer from "multer";

// export const faceUpload = multer({
//   storage: multer.memoryStorage(),

//   limits: {
//     fileSize: 5 * 1024 * 1024,
//   },

//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       "image/jpeg",
//       "image/png",
//     ];

//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(
//         new Error("Only JPG and PNG images are allowed")
//       );
//     }

//     cb(null, true);
//   },
// });

import multer from "multer";

export const faceUpload = multer({
  storage: multer.memoryStorage(),
});