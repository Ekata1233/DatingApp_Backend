export interface DatePlanBoostOptionInput {
  title: string;
  durationHours: number;
  price: number;
  currency?: string;
  isPopular?: boolean;
  sortOrder?: number;
}

export interface CreateOrUpdateDatePlanBoostInput {
  title: string;
  description?: string;
  isActive?: boolean;
  options: DatePlanBoostOptionInput[];
}