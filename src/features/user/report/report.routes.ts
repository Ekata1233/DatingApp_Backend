import express from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import { createUserReportController, getAdminReportByIdController, getAllUserReportsController, getMyReportByIdController, getMyReportsController } from "./report.controller";


const router = express.Router();


router.post(
  "/reports",
  authMiddleware,
  createUserReportController
);
router.get(
  "/reports/my",
  authMiddleware,
  getMyReportsController
);
router.get(
  "/reports/:reportId",
  authMiddleware,
  getMyReportByIdController
);
router.get(
  "/reports",
  
  getAllUserReportsController
);

router.get(
  "/reports/:reportId",
 
  getAdminReportByIdController
);
export default router;