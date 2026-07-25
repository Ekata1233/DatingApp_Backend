import { Router } from "express";
import { loginEmployeeController, registerEmployeeController } from "./employees.controller";

const router = Router();

/**
 * Employee Authentication
 */
router.post(
  "/employee/register",
  registerEmployeeController
);
router.post(
  "/employee/login",
  loginEmployeeController
);
export default router;