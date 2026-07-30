// purchaseStore.controller.ts

export const createPurchaseController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await createPurchaseService(
            req.user.id,
            req.body
        );

        return successResponse(
            res,
            "Purchase initiated successfully",
            result
        );
    } catch (error) {
        next(error);
    }
};