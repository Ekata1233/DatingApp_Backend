import { Router } from "express";

import {
  upsertLegalPageController,
  getAllLegalPagesController,
  getLegalPageByTypeController,
} from "./legal.controller";

const router = Router();

router.post(
  "/legal-pages",
  upsertLegalPageController,
);

router.get(
  "/legal-pages",
  getAllLegalPagesController,
);
router.get("/legal-pages/:pageType", getLegalPageByTypeController);

export default router;