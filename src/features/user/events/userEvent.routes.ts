import { Router } from "express";

import {
  calculateEventCheckoutController,
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
router.post(
  "/events/:eventId/checkout/calculate",
  authMiddleware,
  calculateEventCheckoutController,
);
export default router;