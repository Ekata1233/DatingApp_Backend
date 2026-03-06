import { Router } from "express";
import {
 getAllUsersController
} from "./user.controller";

const router = Router();

router.get("/get-all", getAllUsersController);

export default router;