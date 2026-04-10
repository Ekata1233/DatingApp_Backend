// modules/user/user.controller.ts

import { Request, Response } from "express";
import { getSuggestionsService } from "./suggestion.service";

export const getSuggestionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { cursor, limit = 10 } = req.query;

    const data = await getSuggestionsService({
      userId,
      cursor: cursor as string,
      limit: Number(limit),
    });

    res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("Suggestions Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
