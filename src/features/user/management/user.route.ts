import { Router } from "express";
import {
  getAllUsersController,
  getSingleUserController,
} from "./user.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.get("/get-all", getAllUsersController);

//IT IS WORKING
router.get("/details/:id",authMiddleware, getSingleUserController);

export default router;
