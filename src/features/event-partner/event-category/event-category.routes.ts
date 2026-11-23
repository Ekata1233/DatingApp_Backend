import { Router } from "express";

import {
  createEventCategoryController,
  getAllEventCategoriesController,
  getEventCategoryByIdController,
  updateEventCategoryController,
  deleteEventCategoryController,
} from "./event-category.controller";

const router = Router();

/*
  IMPORTANT:
  Apply your existing ADMIN authentication and
  authorization middleware to POST, PATCH and DELETE.

  Do not use organizer-only authentication as a
  replacement for admin authorization.
*/

// GET ALL
router.get(
  "/event-categories/get",
  getAllEventCategoriesController
);

// GET BY ID
router.get(
  "/event-categories/:categoryId/get",
  getEventCategoryByIdController
);

// CREATE
router.post(
  "/event-categories/create",
  createEventCategoryController
);

// UPDATE
router.patch(
  "/event-categories/:categoryId/update",
  updateEventCategoryController
);

// DELETE
router.delete(
  "/event-categories/:categoryId/delete",
  deleteEventCategoryController
);

export default router;