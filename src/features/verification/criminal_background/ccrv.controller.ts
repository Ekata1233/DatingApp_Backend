import {
    Request,
    Response,
} from "express";

import { prisma } from "../../../prisma/prismaClient";

import {
    generateCCRVReport,
    fetchCCRVReport,
} from "./ccrv.service";

import {
    generateCCRVSchema,
} from "./ccrv.validation";

import {
    Prisma,
    VerificationStatus,
} from "@prisma/client";

// -----------------------------------------
// Helpers
// -----------------------------------------

const getUserId = (req: Request) => {
    return (req as any).user?.id as
        | string
        | undefined;
};

const formatDate = (
    date: Date | string
): string => {

    return new Date(date)
        .toISOString()
        .slice(0, 10);

};

const getMetadata = (
    metadata: Prisma.JsonValue | null
): Record<string, any> => {

    if (
        metadata &&
        typeof metadata === "object" &&
        !Array.isArray(metadata)
    ) {
        return metadata as Record<string, any>;
    }

    return {};

};

// Replace this helper with your actual
// onboarding address model/JSON structure.

const getUserAddress = async (
    userId: string
): Promise<string | null> => {

    // Get user profile
    const profile = await prisma.userProfile.findUnique({
        where: {
            user_id: userId,
        },
        select: {
            country: true,
            state: true,
            city: true,
            area: true,
        },
    });

    // Profile not found
    if (!profile) {
        return null;
    }

    // Combine address fields
    const address = [
        profile.area,
        profile.city,
        profile.state,
        profile.country,
    ]
        .filter(
            (value): value is string =>
                typeof value === "string" &&
                value.trim().length > 0
        )
        .map((value) => value.trim())
        .join(", ");

    // Return null if address is empty
    if (!address) {
        return null;
    }

    return address;
};

export const generateCCRVController = async (
    req: Request,
    res: Response
) => {

    try {

        const userId = getUserId(req);

        if (!userId) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });

        }

        // -----------------------------------
        // Validate request
        // -----------------------------------

        const validation =
            generateCCRVSchema.safeParse(req.body);

        if (!validation.success) {

            return res.status(400).json({
                success: false,
                message: "Invalid verification details",
                errors: validation.error.flatten(),
            });

        }

        const {
            father_name,
        } = validation.data;

        // -----------------------------------
        // Get user details
        // -----------------------------------

        const user = await prisma.user.findUnique({

            where: {
                id: userId,
            },

            select: {
                id: true,
                full_name: true,
                birth_date: true,
            },

        });

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found",
            });

        }

        if (!user.full_name) {

            return res.status(400).json({
                success: false,
                message: "Full name is required",
            });

        }

        // -----------------------------------
        // Get onboarding address
        // -----------------------------------

        const address =
            await getUserAddress(userId);

        if (!address) {

            return res.status(400).json({
                success: false,
                message:
                    "Please complete your address before verification",
            });

        }

        // -----------------------------------
        // Check existing verification
        // -----------------------------------

        const existingVerification =
            await prisma.userVerification.findFirst({

                where: {
                    userId,
                    type: "CRIMINAL_BACKGROUND_CHECK",
                },

                orderBy: {
                    createdAt: "desc",
                },

            });

        if (
            existingVerification?.status ===
            "VERIFIED"
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "Criminal background verification already completed",
            });

        }

        if (
            existingVerification?.status ===
            "IN_PROGRESS"
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "Criminal background verification is already in progress",
            });

        }

        // -----------------------------------
        // Prepare Gridlines payload
        // -----------------------------------

        const payload = {

            name: user.full_name,

            address,

            ...(father_name
                ? { father_name }
                : {}),

            ...(user.birth_date
                ? {
                    date_of_birth: formatDate(
                        user.birth_date
                    ),
                }
                : {}),

            consent: "Y" as const,

        };

        // -----------------------------------
        // Generate Gridlines report
        // -----------------------------------

        const result =
            await generateCCRVReport(payload);

        if (
            result.status !== 200 ||
            result.data?.code !== "1000" ||
            !result.data?.transaction_id
        ) {

            return res.status(502).json({
                success: false,
                message:
                    "Unable to initiate criminal background verification",
            });

        }

        // -----------------------------------
        // Save verification
        // -----------------------------------

        const verificationData = {

            status: "IN_PROGRESS" as const,

            provider: "GRIDLINES",

            providerRef:
                result.data.transaction_id,

            points: 0,

            startedAt: new Date(),

            verifiedAt: null,

            rejectionReason: null,

            metadata: {

                requestId: result.request_id,

                ccrvStatus:
                    result.data.ccrv_status,

                providerCode:
                    result.data.code,

                consentObtainedAt:
                    new Date().toISOString(),

            },

        };

        const verification =
            existingVerification

                ? await prisma.userVerification.update({

                    where: {
                        id: existingVerification.id,
                    },

                    data: verificationData,

                })

                : await prisma.userVerification.create({

                    data: {

                        userId,

                        type:
                            "CRIMINAL_BACKGROUND_CHECK",

                        maxPoints: 10,

                        ...verificationData,

                    },

                });

        return res.status(200).json({

            success: true,

            message:
                "Criminal background verification initiated successfully",

            data: {

                verificationId:
                    verification.id,

                status:
                    verification.status,

                transactionId:
                    verification.providerRef,

            },

        });

    } catch (error: any) {

        console.error(
            "Generate CCRV Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to initiate verification",
        });

    }

};

export const fetchCCRVController = async (
    req: Request,
    res: Response
) => {

    try {

        const userId = getUserId(req);

        if (!userId) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });

        }

        // -----------------------------------
        // Find user's verification
        // -----------------------------------

        const verification =
            await prisma.userVerification.findFirst({

                where: {

                    userId,

                    type:
                        "CRIMINAL_BACKGROUND_CHECK",

                    provider: "GRIDLINES",

                },

                orderBy: {
                    createdAt: "desc",
                },

            });

        if (!verification) {

            return res.status(404).json({
                success: false,
                message:
                    "Criminal background verification not found",
            });

        }

        if (!verification.providerRef) {

            return res.status(400).json({
                success: false,
                message:
                    "Gridlines transaction ID not found",
            });

        }

        // -----------------------------------
        // Return existing final status
        // -----------------------------------

        if (
            verification.status === "VERIFIED" ||
            verification.status === "REJECTED" ||
            verification.status === "LOCKED"
        ) {

            return res.status(200).json({

                success: true,

                data: {

                    verificationId:
                        verification.id,

                    status:
                        verification.status,

                    verifiedAt:
                        verification.verifiedAt,

                },

            });

        }

        // -----------------------------------
        // Fetch Gridlines report
        // -----------------------------------

        const result =
            await fetchCCRVReport(
                verification.providerRef
            );

        const code =
            String(result.data?.code ?? "");

        const providerStatus =
            result.data?.ccrv_status;

        // -----------------------------------
        // Map Gridlines status
        // -----------------------------------

        let newStatus: VerificationStatus =
            "IN_PROGRESS";

        let rejectionReason:
            string | null = null;

        let verifiedAt:
            Date | null = null;

        switch (code) {

            case "1002":

                newStatus = "IN_PROGRESS";

                break;

            case "1004":

                // Do not automatically approve solely
                // because the report has completed.
                // Apply your verified identity and
                // report-review criteria here.

                newStatus = "IN_PROGRESS";

                break;

            case "1006":

                // A failed CCRV result requires review.
                // A case match is not automatically
                // equivalent to a conviction.

                newStatus = "IN_PROGRESS";

                break;

            case "1008":

                newStatus = "REJECTED";

                rejectionReason =
                    "Candidate is a minor";

                break;

            case "1010":

                newStatus = "IN_PROGRESS";

                rejectionReason =
                    "Region not supported";

                break;

            case "1001":

                newStatus = "EXPIRED";

                rejectionReason =
                    "Gridlines session expired";

                break;

            default:

                throw new Error(
                    `UNEXPECTED_CCRV_CODE:${code}`
                );

        }

        // -----------------------------------
        // Update verification record
        // -----------------------------------

        const oldMetadata =
            getMetadata(verification.metadata);

        const updatedVerification =
            await prisma.userVerification.update({

                where: {
                    id: verification.id,
                },

                data: {

                    status: newStatus,

                    verifiedAt,

                    rejectionReason,

                    metadata: {

                        ...oldMetadata,

                        providerCode: code,

                        ccrvStatus:
                            providerStatus,

                        lastCheckedAt:
                            new Date().toISOString(),

                        reportAvailable:
                            ["1004", "1006"].includes(code),

                    },

                },

            });

        return res.status(200).json({

            success: true,

            message:
                result.data?.message ||
                "Verification status fetched successfully",

            data: {

                verificationId:
                    updatedVerification.id,

                status:
                    updatedVerification.status,

                providerCode: code,

                providerStatus,

                requiresReview:
                    ["1004", "1006"].includes(code),

            },

        });

    } catch (error: any) {

        console.error(
            "Fetch CCRV Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch verification status",
        });

    }

};