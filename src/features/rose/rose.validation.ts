// rose.validation.ts
import { body, query, param } from 'express-validator';
import { RoseType } from '@prisma/client';

export class RoseValidation {
  static sendRose = [
    body('receiverId')
      .isUUID()
      .withMessage('Invalid receiver ID format'),
    
    body('roseType')
      .isIn(Object.values(RoseType))
      .withMessage('Rose type must be PURCHASED'),
    
    body('message')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Message must be between 1 and 200 characters'),
  ];

  static getBalance = [
    // No validation needed for authenticated user
  ];

  static getHistory = [
    query('type')
      .optional()
      .isIn(['sent', 'received'])
      .withMessage('Type must be sent or received'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ];
}