import { Request, Response } from "express";
import { sendGiftSchema } from "./gift.validation";
import { sendGiftService } from "./gift.service";

export const sendGiftController = async (
  req: any,
  res: Response
) => {
  try {
    const payload = sendGiftSchema.parse(req.body);

    const result = await sendGiftService(
      req.user.id,
      payload
    );

    return res.status(200).json({
      success: true,
      message: "Gift sent successfully.",
      data: result,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};