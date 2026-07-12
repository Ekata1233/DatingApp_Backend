// src/modules/payment/payment.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import express from 'express'; // Add this import for express.raw()
import { PaymentController } from './payment.controller';

const router = Router();
const paymentController = new PaymentController();

// Create payment order
router.post('/create-order', express.json(), paymentController.createOrder);

// Verify payment
router.post('/verify-payment', express.json(), paymentController.verifyPayment);

// Webhook endpoint - must use raw body for signature verification
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  (req: Request, res: Response, next: NextFunction) => {
    // Parse raw body to JSON for the controller
    if (req.body && Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString());
      } catch (error) {
        console.error('Error parsing webhook body:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON payload'
        });
      }
    }
    next();
  },
  paymentController.handleWebhook
);

// Get payment status
router.get('/status/:paymentId', paymentController.getPaymentStatus);

// Get user payments
router.get('/user/:userId', paymentController.getUserPayments);

// Refund payment
router.post('/refund/:paymentId', express.json(), paymentController.refundPayment);

export default router;