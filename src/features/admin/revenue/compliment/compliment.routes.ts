import { Router } from "express";

import {
  // Category
  createComplimentCategoryController,
  getAllComplimentCategoryController,
  getComplimentCategoryByIdController,
  updateComplimentCategoryController,
  deleteComplimentCategoryController,

  // Idea
  createComplimentIdeaController,
  getAllComplimentIdeaController,
  getComplimentIdeaByCategoryController,
  getComplimentIdeaByIdController,
  updateComplimentIdeaController,
  deleteComplimentIdeaController,

} from "./compliment.controller";


const router = Router();



// =================================================
// CATEGORY ROUTES
// =================================================


// Create Category
router.post(
  "/compliment-category/create",
  createComplimentCategoryController
);


// Get All Categories
router.get(
  "/compliment-category/get",
  getAllComplimentCategoryController
);


// Get Category By Id
router.get(
  "/compliment-category/get/:id",
  getComplimentCategoryByIdController
);


// Update Category
router.put(
  "/compliment-category/update/:id",
  updateComplimentCategoryController
);


// Delete Category
router.delete(
  "/compliment-category/delete/:id",
  deleteComplimentCategoryController
);






// =================================================
// IDEA ROUTES
// =================================================


// Create Idea
router.post(
  "/compliment-idea/create",
  createComplimentIdeaController
);


// Get All Ideas
router.get(
  "/compliment-idea/get",
  getAllComplimentIdeaController
);


// Get Ideas By Category
router.get(
  "/compliment-idea/category/:categoryId",
  getComplimentIdeaByCategoryController
);


// Get Idea By Id
router.get(
  "/compliment-idea/get/:id",
  getComplimentIdeaByIdController
);


// Update Idea
router.put(
  "/compliment-idea/update/:id",
  updateComplimentIdeaController
);


// Delete Idea
router.delete(
  "/compliment-idea/delete/:id",
  deleteComplimentIdeaController
);



export default router;