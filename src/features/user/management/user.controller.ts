import { Request, Response } from "express";
import * as userService from "./user.service";

//FETCH ALL USERS
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


//FETCH SINGLE USER
export const getSingleUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const user = await userService.getSingleUser(id);
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
