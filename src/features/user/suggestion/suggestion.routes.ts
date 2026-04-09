// modules/user/user.routes.ts

import express from "express";
import { getSuggestionsController } from "./suggestion.controller";
import  authMiddleware  from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/suggestions", authMiddleware, getSuggestionsController);

export default router;
