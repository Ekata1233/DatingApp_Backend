// rose.controller.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { RoseService } from './rose.service';
import { SendRoseDTO, RoseHistoryQuery } from './rose.types';
import { AppError } from '../../shared/errors/AppError';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export class RoseController {
  constructor(private roseService: RoseService) {}

  sendRose = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Validation failed', errors.array());
    }

    const senderId = req.user!.id; // Assuming auth middleware sets user
    const sendRoseDTO: SendRoseDTO = {
      receiverId: req.body.receiverId,
      roseType: req.body.roseType,
      message: req.body.message,
    };

    const result = await this.roseService.sendRose(senderId, sendRoseDTO);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  });

  getBalance = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const balance = await this.roseService.getBalance(userId);

    res.status(200).json({
      status: 'success',
      data: balance,
    });
  });

  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Validation failed', errors.array());
    }

    const userId = req.user!.id;
    const query: RoseHistoryQuery = {
      type: req.query.type as 'sent' | 'received' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    const history = await this.roseService.getHistory(userId, query);

    res.status(200).json({
      status: 'success',
      data: history,
    });
  });
}