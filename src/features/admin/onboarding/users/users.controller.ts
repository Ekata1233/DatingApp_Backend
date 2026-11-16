import { Request, Response } from "express";
import * as userService from "./users.service"; // Adjust path if needed

export const getAllUsersController = async (
  req: Request,
  res: Response
) => {
  try {
    const users = await userService.getAllUsers();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error: unknown) {
    console.error("GET ALL USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
};




// ==========================================
// GET SINGLE USER CONTROLLER
// ==========================================

export const getSingleUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.params.userId;

    // Validate userId
    if (
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID format",
      });
    }

    // Fetch using only userId
    const user = await userService.getSingleUser(userId);

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error: unknown) {
    console.error(
      "GET SINGLE USER ERROR:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "User not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
};
