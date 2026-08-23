import { Router } from "express";


import {
  getMyPlansController,
  
} from "./datePlanMyPlans.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.get(
  "/date-plans/my-plans",
  authMiddleware,
  getMyPlansController,
);


export default router;