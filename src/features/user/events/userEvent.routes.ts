import { Router } from "express";

import {
  getAllUserEventsController,
} from "./userEvent.controller";
import authMiddleware from "../../../middleware/auth.middleware";



const router = Router();

// GET ALL PUBLISHED EVENTS FOR USER
router.get(
  "/events/get-all",
  authMiddleware,
  getAllUserEventsController
);

export default router;