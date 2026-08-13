export interface GetPlansQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}
export interface DatePlanPackageInfoPayload {
  howOnePlanWorks?: unknown;
  whyPeopleBuyPlans?: unknown;
  goodToKnow?: unknown;
}

export interface DatePlanPackageFeaturesPayload {
  costToPostPlan?: number;
  costToPostPlanActive?: boolean;
  costToPostPlanPaidOnly?: boolean;

  planBoostPrice?: number;
  planBoostActive?: boolean;
  planBoostPaidOnly?: boolean;
}