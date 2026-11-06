import { Router } from "express";
import multer from "multer";

import {
  createPackageProgramController,
  getAllPackageProgramsController,
  getPackageProgramByIdController,
  updatePackageProgramController,
  deletePackageProgramController,
} from "./packagePrograms.controller";


const router = Router();

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 20,
  },

  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG and WEBP images are allowed")
      );
    }

    cb(null, true);
  },
});

// ==========================================
// CREATE PACKAGE PROGRAM
// ==========================================

router.post(
  "/package-programs/create",

  upload.array("images", 20),
  createPackageProgramController
);

// ==========================================
// GET ALL PACKAGE PROGRAMS
// ==========================================

router.get(
  "/package-programs/get",

  getAllPackageProgramsController
);

// ==========================================
// GET PACKAGE PROGRAM BY ID
// ==========================================

router.get(
  "/package-programs/get/:id",
 
  getPackageProgramByIdController
);

// ==========================================
// UPDATE PACKAGE PROGRAM
// ==========================================

router.patch(
  "/package-programs/update/:id",
 
  upload.array("images", 20),
  updatePackageProgramController
);

// ==========================================
// DELETE PACKAGE PROGRAM
// ==========================================

router.delete(
  "/package-programs/delete/:id",

  deletePackageProgramController
);

export default router;