export interface IAmbition {
  title: string;
  isActive: boolean;
}import { Router } from "express";

import {
  create,
  update,
  getAll,
  getActive,
  getOne,
  remove,
} from "./ambition.controller";

const router = Router();

/**
 * Admin
 */
router.post("/create", create);
router.put("/update/:id", update);
router.get("/get-all", getAll);
router.get("/get-one/:id", getOne);
router.delete("/remove/:id", remove);
router.get("/ambitions/get", getActive);
export default router;