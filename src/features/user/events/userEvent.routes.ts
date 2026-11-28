import { Router } from "express";

import {
  calculateEventCheckoutController,
  getAllUserEventsController,
  getUserEventByIdController,
} from "./userEvent.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import { optionalAuthMiddleware } from "../../../middleware/optional.middleware";



const router = Router();

// GET ALL PUBLISHED EVENTS FOR USER
// router.get(
//   "/events/get-all",
//   authMiddleware,
//   getAllUserEventsController
// );

router.get(
  "/events/get-all",
  optionalAuthMiddleware,
  getAllUserEventsController,
);
router.get(
  "/events/:eventId/get",
  optionalAuthMiddleware,
  getUserEventByIdController,
);
router.post(
  "/events/:eventId/checkout/calculate",
  authMiddleware,
  calculateEventCheckoutController,
);
export default router;