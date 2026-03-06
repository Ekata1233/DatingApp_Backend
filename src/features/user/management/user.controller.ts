import { Request, Response } from "express";
import * as userService from "./user.service";

export const getAllUsersController = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};