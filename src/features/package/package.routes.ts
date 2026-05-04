import express from "express";
import { activatePackage } from "./package.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = express.Router();

router.post(
  "/activate",
  authMiddleware,
  activatePackage
);

export default router;
