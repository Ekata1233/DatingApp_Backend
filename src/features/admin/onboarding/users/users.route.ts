// import { getAllUsersController } from "./users.controller";

// export async function getAllUsersRoute() {
//   return await getAllUsersController();
// }
// export default router;

import { Router } from "express";
import { getAllUsersController } from "./users.controller";

const router = Router();

router.get("/get-all", getAllUsersController);

export default router;
