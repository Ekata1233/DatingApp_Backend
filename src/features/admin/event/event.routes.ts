import { Router } from "express";
import { createEventController } from "./event.controller";

const router = Router();

router.post(
  "/events",
  createEventController
);

export default router;