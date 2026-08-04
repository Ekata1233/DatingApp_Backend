import { Router } from "express";
import {
  create,
  update,
  getAll,
  getOne,
  remove,
  updateReligion,
  addCommunity,
  updateCommunity,
  deleteCommunity,
  deleteReligion,
  getActiveReligion,
} from "./religion.controller";

const router = Router();

router.post("/create", create);

router.put("/update/:id", update);

router.get("/get-all", getAll);
router.get("/get", getActiveReligion);

router.get("/get/:id", getOne);

router.delete("/remove/:id", remove);

// Religion only
router.patch("/:id", updateReligion);

// Add community in religion
router.post(
  "/:religionId/community",
  addCommunity
);

// Update community
router.patch(
  "/community/:communityId",
  updateCommunity
);

// Delete community
router.delete(
  "/community/:communityId",
  deleteCommunity
);

// Delete religion with all communities
router.delete(
  "/:id",
  deleteReligion
);

export default router;