import { Request, Response } from "express";
import { createUserReportValidation } from "./report.validation";
import { createUserReportService,  getAdminReportByIdService,  getAllUserReportsService,  getMyReportByIdService, getMyReportsService } from "./report.service";


export const createUserReportController = async (
  req: Request,
  res: Response
) => {
  try {
    const reporterId = (req as any).user.id;

    const payload = createUserReportValidation.parse(req.body);

    const report = await createUserReportService(
      reporterId,
      payload
    );

    return res.status(201).json({
      success: true,
      message: "User reported successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};




export const getMyReportsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const reports = await getMyReportsService(userId);

    return res.status(200).json({
      success: true,
      message: "Your reports fetched successfully",
      count: reports.length,
      data: reports,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyReportByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const reportId = req.params.reportId as string;

    const report = await getMyReportByIdService(
      userId,
      reportId
    );

    return res.status(200).json({
      success: true,
      message: "Report fetched successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUserReportsController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      status,
      reason,
      reportedId,
      reporterId,
      page = "1",
      limit = "20",
    } = req.query;

    const result = await getAllUserReportsService({
      status: status as string | undefined,
      reason: reason as string | undefined,
      reportedId: reportedId as string | undefined,
      reporterId: reporterId as string | undefined,
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json({
      success: true,
      message: "Reports fetched successfully",
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAdminReportByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const reportId = req.params.reportId as string;

    const report = await getAdminReportByIdService(
      reportId
    );

    return res.status(200).json({
      success: true,
      message: "Report fetched successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};