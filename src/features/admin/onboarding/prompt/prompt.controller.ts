import { Request, Response } from "express";
import {
    createPromptCategoryValidation,
    updatePromptCategoryValidation,
    createPromptValidation,
    updatePromptValidation,
} from "./prompt.validation";

import {
    createPromptCategoryService,
    updatePromptCategoryService,
    deletePromptCategoryService,
    getPromptCategoryService,
    createPromptService,
    updatePromptService,
    deletePromptService,
    getPromptService,
    getActivePromptsService,
} from "./prompt.service";


// ==========================
// Prompt Category
// ==========================

export const createPromptCategoryController = async (
    req: Request,
    res: Response
) => {
    try {
        const body = createPromptCategoryValidation.parse(req.body);

        const data = await createPromptCategoryService(body);

        return res.status(201).json({
            success: true,
            message: "Prompt category created successfully.",
            data,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const updatePromptCategoryController = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const body = updatePromptCategoryValidation.parse(req.body);

        const data = await updatePromptCategoryService(id, body);

        return res.status(200).json({
            success: true,
            message: "Prompt category updated successfully.",
            data,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const deletePromptCategoryController = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        await deletePromptCategoryService(id);

        return res.status(200).json({
            success: true,
            message: "Prompt category deleted successfully.",
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getPromptCategoryController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = await getPromptCategoryService();

        return res.status(200).json({
            success: true,
            message: "Prompt categories fetched successfully.",
            data,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


// ==========================
// Prompt
// ==========================

export const createPromptController = async (
    req: Request,
    res: Response
) => {
    try {
        const body = createPromptValidation.parse(req.body);

        const data = await createPromptService(body);

        return res.status(201).json({
            success: true,
            message: "Prompt created successfully.",
            data,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const updatePromptController = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const body = updatePromptValidation.parse(req.body);

        const data = await updatePromptService(id, body);

        return res.status(200).json({
            success: true,
            message: "Prompt updated successfully.",
            data,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const deletePromptController = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        await deletePromptService(id);

        return res.status(200).json({
            success: true,
            message: "Prompt deleted successfully.",
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getPromptController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = await getPromptService();

        return res.status(200).json({
            success: true,
            message: "Prompts fetched successfully.",
            data,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getActivePromptController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = await getActivePromptsService();

        return res.status(200).json({
            success: true,
            message: "Prompts fetched successfully.",
            data,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};