
import { Router } from "express";

import {
  createPackageProgramController,
  getAllPackageProgramsController,
  getPackageProgramByIdController,
  updatePackageProgramController,
  deletePackageProgramController,
} from "./packagePrograms.controller";

const router = Router();

// ==========================================
// CREATE PACKAGE PROGRAM
// ==========================================

router.post(
  "/package-programs/create",
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
