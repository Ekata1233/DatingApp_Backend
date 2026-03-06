import { Request, Response } from "express";
import { googleLoginService } from "./google-auth.service";

export const googleLoginController = async (req: Request, res: Response) => {
  try {
    console.log("Google Login Request Body:", req.body); // Debugging log
    const { idToken } = req.body;

    const data = await googleLoginService(idToken);

    res.json(data);
  } catch (error) {
    console.log("Google Login Error:", error); // ✅ add this
    res.status(400).json({ message: "Google Authentication Failed" });
  }
};
