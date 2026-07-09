import { Router } from "express";
import {
  saveLaunchConfigController,
  getLaunchConfigController,
} from "./waitlist.controller";

const router = Router();

router.post("/waitlist/create", saveLaunchConfigController);
router.get("/waitlist/get", getLaunchConfigController);

export default router;