import { Request, Response } from "express";
import * as userService from "./user.service";

//FETCH ALL USERS
// export const getAllUsersController = async (req: Request, res: Response) => {
//   try {
//     const users = await userService.getAllUsers();

//     res.status(200).json({
//       success: true,
//       message: "Users fetched successfully",
//       data: users,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//     });
//   }
// };
export const getAllUsersController = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();

    console.log("users list : ", users);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error: any) {
    console.error("GET ALL USERS ERROR:", error); // 👈 IMPORTANT

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// FETCH SINGLE USER
export const getSingleUserController = async (req: Request, res: Response) => {
  try {
    console.log("GET USER DETAILS CONTROLLER CALLED");
    const { id } = req.params;

    if (Array.isArray(id) || !id) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const currentUserId = (req as any).user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await userService.getSingleUser(id, currentUserId);
    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get single user error:", error);

    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
