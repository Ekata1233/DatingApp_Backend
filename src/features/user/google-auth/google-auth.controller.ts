import { Request, Response } from "express";
import { googleLoginService } from "./google-auth.service";

export const googleLoginController = async (req: Request, res: Response) => {
  try {
    console.log("request",req);
    
    const { idToken } = req.body;

    const data = await googleLoginService(idToken);

    res.json(data);
  } catch (error: any) {
  console.log("Google Auth Error 👉", error.response?.data || error.message);
  res.status(400).json({
    message: "Google Authentication Failed",
    error: error.message,
  });
}

};
