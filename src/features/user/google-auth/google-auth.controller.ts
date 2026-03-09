import { Request, Response } from "express";
import { googleLoginService } from "./google-auth.service";

export const googleLoginController = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    const data = await googleLoginService(idToken);

    res.json(data);
  } catch (error) {
    console.log("Google Login Error:", error); 
    res.status(400).json({ message: "Google Authentication Failed" });
  }
};
  