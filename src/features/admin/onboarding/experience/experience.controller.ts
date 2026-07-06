import { Request, Response } from "express"
import {
  createExperience,
  getAllExperience,
  updateExperience,
  deleteExperience,
  getActiveExperience,
} from "./experience.service"

export const createExperienceController = async (req: Request, res: Response) => {
  try {
    const data = await createExperience(req.body)
    return res.status(201).json({ success: true, data })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getAllExperienceController = async (_req: Request, res: Response) => {
  try {
    const data = await getAllExperience()
    return res.status(200).json({ success: true, data })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const updateExperienceController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const data = await updateExperience(id, req.body)
    return res.status(200).json({ success: true, data })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteExperienceController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    await deleteExperience(id)
    return res.status(200).json({ success: true, message: "Deleted successfully" })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}



export const getActiveExperienceController = async (
  _req: Request,
  res: Response
) => {
  try {
    const data = await getActiveExperience()

    return res.status(200).json({
      success: true,
      data,
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}