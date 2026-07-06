import { Router } from "express";

import {
  create,
  update,
  getAll,
  getActive,
  getOne,
  remove,
} from "./salaryRange.controller";

const router = Router();

/**
 * Admin Routes
 */
router.post("/salary-ranges/create", create);
router.put("/salary-ranges/update/:id", update);
router.get("/salary-ranges/get-all", getAll);
router.get("/salary-ranges/get-one/:id", getOne);
router.delete("/salary-ranges/remove/:id", remove);
router.get("/salary-ranges/get", getActive);
export default router;