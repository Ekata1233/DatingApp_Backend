import { Router } from "express";
import {
  getAllUsersController,
  getSingleUserController,
} from "./user.controller";

const router = Router();

/**
 * @swagger
 * /api/user/get-all:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     description: Fetches a list of all users along with their onboarding status.
 *     responses:
 *       200:
 *         description: Users fetched successfully
 */
router.get("/get-all", getAllUsersController);

/**
 * @swagger
 * /api/user/details/{id}:
 *   get:
 *     summary: Get single user
 *     tags: [Users]
 *     description: Fetches details of a single user by their unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the user
 *         schema:
 *           type: string
 *           example: 6d96cfd6-3a1d-46f0-b08b-e3831fb778ed
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       404:
 *         description: User not found
 */
router.get("/details/:id", getSingleUserController);

export default router;
