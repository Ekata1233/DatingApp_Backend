import { Router } from "express";
import {
  create,
  update,
  getAll,
  getOne,
  remove,
} from "./religion.controller";

const router = Router();

router.post("/create", create);

router.put("/update/:id", update);

router.get("/get-all", getAll);

router.get("/get/:id", getOne);

router.delete("/remove/:id", remove);

export default router;