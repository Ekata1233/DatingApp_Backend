
// import { Router } from "express";

// import authMiddleware from
//   "../../../middleware/auth.middleware";


// import {
//   verifyFaceController,
//   getFaceVerificationStatusController,
// } from "./face-verification.controller";
// import { faceUpload } from "./face-upload.middleware";

// const router = Router();

// // POST - Verify selfie with Government ID photo
// router.post(
//   "/face/verify",
//   authMiddleware,
//   faceUpload.single("selfie"),
//   verifyFaceController
// );

// // GET - Current face verification status
// router.get(
//   "/face/status",
//   authMiddleware,
//   getFaceVerificationStatusController
// );

// export default router;