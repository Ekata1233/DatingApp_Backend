import { Request, Response } from "express";
import {
  sendRoseService,
  getRoseBalanceService,
  getRoseHistoryService,
  addPurchasedRosesService,
} from "./rose.service";

import {
  sendRoseSchema,
  getHistoryQuerySchema,
  addPurchasedRosesSchema,
  validate,
} from "./rose.validation";

export const sendRoseController = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const validatedData = validate(sendRoseSchema, req.body);

    const data = await sendRoseService(senderId, {
      ...validatedData,
    });

    return res.status(201).json({
      success: true,
      message: "Rose sent successfully",
      data,
    });
  } catch (error: any) {
    console.error("Send Rose Error:", error.message);

    const errorMap: Record<string, string> = {
      USER_NOT_FOUND: "User not found",
      RECEIVER_NOT_FOUND: "Receiver not found",
      CANNOT_SEND_TO_SELF: "You cannot send a rose to yourself",
      INSUFFICIENT_ROSES: "You don't have enough roses",
      ALREADY_SENT: "Rose already sent",
      MATCH_NOT_FOUND: "You can only send roses to matched users",
    };

    return res.status(400).json({
      success: false,
      message: errorMap[error.message] || "Something went wrong",
    });
  }
};

export const getRoseBalanceController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const data = await getRoseBalanceService(userId);

    return res.status(200).json({
      success: true,
      message: "Rose balance fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error("Get Rose Balance Error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getRoseHistoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const validatedQuery = validate(getHistoryQuerySchema, req.query);

    const data = await getRoseHistoryService(userId, validatedQuery);

    return res.status(200).json({
      success: true,
      message: "Rose history fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error("Get Rose History Error:", error.message);

    const errorMap: Record<string, string> = {
      INVALID_PAGINATION: "Invalid pagination parameters",
    };

    return res.status(400).json({
      success: false,
      message: errorMap[error.message] || "Something went wrong",
    });
  }
};

export const addPurchasedRosesController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = validate(addPurchasedRosesSchema, req.body);

    const data = await addPurchasedRosesService(
      userId,
      validatedData.amount
    );

    return res.status(200).json({
      success: true,
      message: "Purchased roses added successfully",
      data,
    });
  } catch (error: any) {
    console.error("Add Purchased Roses Error:", error.message);

    const errorMap: Record<string, string> = {
      INVALID_AMOUNT: "Invalid amount",
      USER_NOT_FOUND: "User not found",
    };

    return res.status(400).json({
      success: false,
      message: errorMap[error.message] || "Something went wrong",
    });
  }
};