import { Router } from "express";
import {
  createGiftCategoryController,
  getGiftCategoriesController,
  getGiftCategoryByIdController,
  updateGiftCategoryController,
  deleteGiftCategoryController,
  createGiftController,
  getAllGiftController,
  getGiftByIdController,
  updateGiftController,
  deleteGiftController,
} from "./gifts.controller";


import {
  createGiftCategorySchema,
  updateGiftCategorySchema,
  giftCategoryIdSchema,
} from "./gifts.validation";

const router = Router();

/**
 * Create Gift Category
 * POST /gifts/create
 */
router.post(
  "/gift-category/create",
  createGiftCategoryController
);

/**
 * Get All Gift Categories
 * GET /gifts/list
 */
router.get(
  "/gift-category/list",
  getGiftCategoriesController
);

/**
 * Get Gift Category By Id
 * GET /gifts/details/:id
 */
router.get(
  "/gift-category/details/:id",
  getGiftCategoryByIdController
);

/**
 * Update Gift Category
 * PUT /gifts/update/:id
 */
router.put(
  "/gift-category/update/:id",
  updateGiftCategoryController
);

/**
 * Delete Gift Category
 * DELETE /gifts/delete/:id
 */
router.delete(
  "/gift-category/delete/:id",
  deleteGiftCategoryController
);


/**
 * Create Gift
 * POST /gift/create
 */
router.post(
  "/gift/create",
  createGiftController
);

/**
 * Get All Gifts
 * GET /gift/list
 */
router.get(
  "/gift/list",
  getAllGiftController
);

/**
 * Get Gift By Id
 * GET /gift/details/:id
 */
router.get(
  "/gift/details/:id",
  getGiftByIdController
);

/**
 * Update Gift
 * PUT /gift/update/:id
 */
router.put(
  "/gift/update/:id",
  updateGiftController
);


/**
 * Delete Gift
 * DELETE /gift/delete/:id
 */
router.delete(
  "/gift/delete/:id",
  deleteGiftController
);

export default router;