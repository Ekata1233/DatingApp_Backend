import { Router } from "express";

import {
  create,
  update,
  getAll,
  getOne,
  remove,
} from "./employmentType.controller";

const router = Router();

router.post("/employment-type/create", create);

router.put("/employment-type/update/:id", update);

router.get("/employment-type/get-all", getAll);

router.get("/employment-type/get/:id", getOne);

router.delete("/employment-type/remove/:id", remove);

export default router;