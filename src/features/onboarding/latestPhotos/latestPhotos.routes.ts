import { Router } from "express";
import {
  create,
  getOne,
  remove,
  updatePhoto,
} from "./latestPhotos.controller";

const router = Router();

router.post("/", create);
router.get("/", getOne);
router.delete("/", remove);
router.put("/photo/:photoId", updatePhoto);

export default router;
