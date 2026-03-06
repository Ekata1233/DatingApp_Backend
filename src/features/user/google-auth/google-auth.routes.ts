import { Router } from "express";
import { googleLoginController } from "./google-auth.controller";

const router = Router();

router.post("/google-login", googleLoginController);

export default router;
