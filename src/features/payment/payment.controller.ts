// src/modules/payment/payment.controller.ts

import { Request, Response } from 'express';
import crypto from 'crypto';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from './payment.types';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  // Create Payment Order
  createOrder = async (req: Request, res: Response) => {
    try {
      const { userId, packageId, amount, currency, purpose, notes } = req.body;

      // Validate required fields
      if (!userId || !amount || !purpose) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, amount, purpose',
        });
      }

      const createOrderDto: CreateOrderDto = {
        userId,
        packageId,
        amount: Number(amount),
        currency: currency || 'INR',
        purpose,
        notes: {
          ...notes,
          userId,
          packageId: packageId || null,
        },
      };

      const result = await this.paymentService.createOrder(createOrderDto);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Payment order created successfully',
      });
    } catch (error) {
      console.error('Error in createOrder:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Verify Payment
  verifyPayment = async (req: Request, res: Response) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

      // Validate required fields
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required payment verification fields',
        });
      }

      // Verify signature
      const isValid = this.paymentService.verifyPaymentSignature({
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      });

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature',
        });
      }

      // Get payment ID from order notes
      const order = await this.paymentService.fetchOrder(razorpay_order_id);
      const paymentId = (order.notes as any)?.paymentId;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID not found in order notes',
        });
      }

      // Process successful payment
      const payment = await this.paymentService.processSuccessfulPayment(
        paymentId,
        razorpay_payment_id
      );

      return res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment verified and processed successfully',
      });
    } catch (error) {
      console.error('Error in verifyPayment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Webhook Handler
  handleWebhook = async (req: Request, res: Response) => {
    try {
      // Get the raw body for signature verification
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const body = JSON.stringify(req.body);

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature',
        });
      }

      const event = req.body.event;
      const payload = req.body.payload;

      console.log(`Webhook event received: ${event}`);

      // Handle different webhook events
      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;
        case 'payment.refunded':
          await this.handlePaymentRefunded(payload);
          break;
        case 'order.paid':
          await this.handleOrderPaid(payload);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('Error in webhook handler:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
      });
    }
  };

  // Webhook Event Handlers
  private handlePaymentCaptured = async (payload: any) => {
    try {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;
      
      // Fetch order details
      const order = await this.paymentService.fetchOrder(orderId);
      const paymentId = (order.notes as any)?.paymentId;

      if (paymentId) {
        await this.paymentService.processSuccessfulPayment(paymentId, paymentEntity.id);
        console.log(`Payment ${paymentEntity.id} captured successfully`);
      }
    } catch (error) {
      console.error('Error handling payment.captured webhook:', error);
    }
  };

  private handlePaymentFailed = async (payload: any) => {
    try {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;
      
      // Fetch order details
      const order = await this.paymentService.fetchOrder(orderId);
      const paymentId = (order.notes as any)?.paymentId;

      if (paymentId) {
        await this.paymentService.processFailedPayment(paymentId, {
          error_code: paymentEntity.error_code,
          error_description: paymentEntity.error_description,
        });
        console.log(`Payment ${paymentEntity.id} failed`);
      }
    } catch (error) {
      console.error('Error handling payment.failed webhook:', error);
    }
  };

  private handlePaymentRefunded = async (payload: any) => {
    try {
      const paymentEntity = payload.payment.entity;
      console.log(`Payment ${paymentEntity.id} refunded`);
      // Add refund handling logic here
    } catch (error) {
      console.error('Error handling payment.refunded webhook:', error);
    }
  };

  private handleOrderPaid = async (payload: any) => {
    try {
      const orderEntity = payload.order.entity;
      console.log(`Order ${orderEntity.id} paid`);
      // Add order paid handling logic here
    } catch (error) {
      console.error('Error handling order.paid webhook:', error);
    }
  };

  // Get Payment Status
  getPaymentStatus = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
      }

      const payment = await this.paymentService.getPaymentStatus(paymentId);

      return res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      console.error('Error in getPaymentStatus:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get payment status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Get User Payments
  getUserPayments = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const payments = await this.paymentService.getUserPayments(userId);

      return res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      console.error('Error in getUserPayments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user payments',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Refund Payment
  refundPayment = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const { amount } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
      }

      const payment = await this.paymentService.refundPayment(paymentId, amount);

      return res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment refunded successfully',
      });
    } catch (error) {
      console.error('Error in refundPayment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to refund payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}