import { z } from "zod";

import {
  saveReactivationSchema,
  getReactivationQuerySchema,
  pauseReactivationSchema,
  completeReactivationSchema,
  cancelReactivationSchema,
} from "./event.reactivation.validation";

export type SaveReactivationInput = z.infer<
  typeof saveReactivationSchema
>;

export type GetReactivationQuery = z.infer<
  typeof getReactivationQuerySchema
>;

export type ReactivationDateInput =
  SaveReactivationInput["dates"][number];

  export type PauseReactivationInput = z.infer<
  typeof pauseReactivationSchema
>;

export type CompleteReactivationInput = z.infer<
  typeof completeReactivationSchema
>;

export type CancelReactivationInput = z.infer<
  typeof cancelReactivationSchema
>;