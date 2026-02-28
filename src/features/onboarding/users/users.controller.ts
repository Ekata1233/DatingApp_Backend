// import { fetchAllUsers } from "./users.service";

// export async function getAllUsersController() {
//   try {
//     const users = await fetchAllUsers();

//     console.log("users  : ", users);

//     return {
//       success: true,
//       data: users,
//     };

//   } catch (error) {
//     console.error("Controller Error:", error);

//     return {
//       success: false,
//       message: "Failed to fetch users",
//     };
//   }
// }


import { Request, Response } from "express";
import { fetchAllUsers } from "./users.service";

export async function getAllUsersController(req: Request, res: Response) {
  try {
    const users = await fetchAllUsers();

    console.log("users:", users);

    return res.status(200).json({
      success: true,
      data: users,
    });

  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
}