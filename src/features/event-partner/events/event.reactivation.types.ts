import { z } from "zod";

import {
  saveReactivationSchema,
  getReactivationQuerySchema,
} from "./event.reactivation.validation";

export type SaveReactivationInput = z.infer<
  typeof saveReactivationSchema
>;

export type GetReactivationQuery = z.infer<
  typeof getReactivationQuerySchema
>;

export type ReactivationDateInput =
  SaveReactivationInput["dates"][number];