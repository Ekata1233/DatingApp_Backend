

import { Router } from "express";
import { getAllUsersController, getSingleUserController } from "./users.controller";

const router = Router();

router.get("/users/get-all", getAllUsersController);

router.get(
  "/users/details/:userId",
  getSingleUserController
);

export default router;
