import {
  Request,
  Response,
} from "express";

import { ZodError } from "zod";

import {
  myPlansQuerySchema,
} from "./datePlanMyPlans.Validation";

import {
  getMyPlansService,
} from "./datePlanMyPlans.service";

export const getMyPlansController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      /**
       * Get logged-in user
       */
      const userId =
        (req as any).user.id;

      /**
       * Validate query
       */
      const query =
        myPlansQuerySchema.parse(
          req.query,
        );

      /**
       * Call service
       */
      const result =
        await getMyPlansService({
          userId,

          period:
            query.period,

          activity:
            query.activity,

          page:
            query.page,

          limit:
            query.limit,
        });

      /**
       * Success
       */
      return res
        .status(200)
        .json(result);
    } catch (error: any) {
      /**
       * Zod validation error
       */
      if (
        error instanceof ZodError
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Validation failed",

            errors:
              error.issues.map(
                (issue) => ({
                  field:
                    issue.path.join(
                      ".",
                    ),

                  message:
                    issue.message,
                }),
              ),
          });
      }

      /**
       * Other error
       */
      return res
        .status(400)
        .json({
          success: false,

          message:
            error.message ??
            "Something went wrong",
        });
    }
  };