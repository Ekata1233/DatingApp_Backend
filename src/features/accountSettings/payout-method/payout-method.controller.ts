import {
  Request,
  Response,
} from "express";

import {
  createPayoutMethodService,
  deletePayoutMethodService,
  getPayoutMethodByIdService,
  getPayoutMethodsService,
  setPrimaryPayoutMethodService,
  updatePayoutMethodService,
} from "./payout-method.service";


// =====================================================
// CREATE
// =====================================================

export const createPayoutMethodController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = (req as any).user?.id;  
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const data =
        await createPayoutMethodService(
          userId,
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "Payout method added successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to add payout method",
      });
    }
  };


// =====================================================
// GET ALL
// =====================================================

export const getPayoutMethodsController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const data =
        await getPayoutMethodsService(
          userId
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to get payout methods",
      });
    }
  };


// =====================================================
// GET ONE
// =====================================================

export const getPayoutMethodByIdController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = (req as any).user?.id;

      const payoutMethodId =
        req.params.id as string;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const data =
        await getPayoutMethodByIdService(
          userId,
          payoutMethodId
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to get payout method",
      });
    }
  };


// =====================================================
// UPDATE
// =====================================================

export const updatePayoutMethodController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = (req as any).user?.id;

      const payoutMethodId =
        req.params.id as string;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const data =
        await updatePayoutMethodService(
          userId,
          payoutMethodId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Payout method updated successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to update payout method",
      });
    }
  };


// =====================================================
// SET PRIMARY
// =====================================================

export const setPrimaryPayoutMethodController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = (req as any).user?.id;

      const payoutMethodId =
        req.params.id as string;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const data =
        await setPrimaryPayoutMethodService(
          userId,
          payoutMethodId
        );

      return res.status(200).json({
        success: true,
        message:
          "Primary payout method updated successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to set primary payout method",
      });
    }
  };


// =====================================================
// DELETE
// =====================================================

export const deletePayoutMethodController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = (req as any).user?.id;

      const payoutMethodId =
        req.params.id as string;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const data =
        await deletePayoutMethodService(
          userId,
          payoutMethodId
        );

      return res.status(200).json({
        success: true,
        message: data.message,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to remove payout method",
      });
    }
  };