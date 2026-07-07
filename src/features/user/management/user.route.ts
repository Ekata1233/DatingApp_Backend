import { Router } from "express";
import {
  getAllUsersController,
  getSingleUserController,
} from "./user.controller";

const router = Router();

router.get("/get-all", getAllUsersController);
router.get("/details/:id", getSingleUserController);

export default router;
