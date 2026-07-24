import { Router } from "express";
import { registerEmployeeController } from "./employee.controller";

const router = Router();

/**
 * Employee Authentication
 */
router.post(
  "/register",
  registerEmployeeController
);

export default router;