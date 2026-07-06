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
router.post("/ambitions/create", create);
router.put("/ambitions/update/:id", update);
router.get("/ambitions/get-all", getAll);
router.get("/ambitions/get-one/:id", getOne);
router.delete("/ambitions/remove/:id", remove);
router.get("/ambitions/get", getActive);
export default router;