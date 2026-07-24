// rose.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  sendRoseService,
  getRoseBalanceService,
  getRoseHistoryService,
  addPurchasedRosesService,
} from './rose.service';
import { 
  sendRoseSchema, 
  getHistoryQuerySchema, 
  addPurchasedRosesSchema,
  validate 
} from './rose.validation';
import { AppError } from './AppError';

// Custom async handler wrapper
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const sendRose = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user!.id; // Assuming auth middleware sets user
  
  // Validate request body using Zod schema
  const validatedData = validate(sendRoseSchema, req.body);

  const result = await sendRoseService(senderId, validatedData);

  res.status(201).json({
    status: 'success',
    ...result,
  });
});

export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const balance = await getRoseBalanceService(userId);

  res.status(200).json({
    status: 'success',
    data: balance,
  });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  // Validate query parameters using Zod schema
  const validatedQuery = validate(getHistoryQuerySchema, req.query);

  const history = await getRoseHistoryService(userId, validatedQuery);

  res.status(200).json({
    status: 'success',
    data: history,
  });
});

export const addPurchasedRoses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  // Validate request body using Zod schema
  const validatedData = validate(addPurchasedRosesSchema, req.body);

  const result = await addPurchasedRosesService(userId, validatedData.amount);

  res.status(200).json({
    status: 'success',
    message: 'Purchased roses added successfully',
    data: result,
  });
});