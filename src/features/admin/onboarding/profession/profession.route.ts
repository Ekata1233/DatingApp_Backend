import { Router } from "express";

import {
  create,
  update,
  getAll,
  getOne,
  remove,
} from "./profession.controller";

const router = Router();

router.post("/profession/create", create);

router.put("/profession/update/:id", update);

router.get("/profession/get-all", getAll);

router.get("/profession/get/:id", getOne);

router.delete("/profession/remove/:id", remove);

export default router;