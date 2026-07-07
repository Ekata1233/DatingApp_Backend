import { Request, Response } from "express";

import {
    createLanguageValidation,
    updateLanguageValidation,
} from "./language.validation";

import {
    createLanguageService,
    deleteLanguageService,
    getActiveLanguagesService,
    getLanguageByIdService,
    getLanguagesService,
    updateLanguageService,
} from "./language.service";

export const createLanguageController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = createLanguageValidation.parse(req.body);

        const language = await createLanguageService(data);

        res.status(201).json({
            success: true,
            message: "Language created successfully",
            data: language,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getLanguagesController = async (
    req: Request,
    res: Response
) => {
    try {
        const languages = await getLanguagesService();

        res.json({
            success: true,
            data: languages,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getActiveLanguagesController = async (
    req: Request,
    res: Response
) => {
    try {
        const languages = await getActiveLanguagesService();

        res.json({
            success: true,
            message: "Language options fetched successfully",
            data: languages,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getLanguageByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);

        const language = await getLanguageByIdService(id);

        res.json({
            success: true,
            data: language,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateLanguageController = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);

        const data = updateLanguageValidation.parse(req.body);

        const language = await updateLanguageService(id, data);

        res.json({
            success: true,
            message: "Language updated successfully",
            data: language,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteLanguageController = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);

        await deleteLanguageService(id);

        res.json({
            success: true,
            message: "Language deleted successfully",
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};