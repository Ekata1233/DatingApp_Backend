export interface CreateCategoryDto {
  code: string;
 title: string;
}

export interface UpdateCategoryDto {
  code?: string;
  title?: string;
}

export interface CreateMasterValueDto {
  categoryId: number;
  value: string;
  priority?: number;
  active?: boolean;
}

export interface UpdateMasterValueDto {
  categoryId?: number;
  value?: string;
  priority?: number;
  active?: boolean;
}

export interface CreateFamilyIncomeDto {
  title: string;
  minAmount?: number;
  maxAmount?: number;
  priority?: number;
  active?: boolean;
}

export interface UpdateFamilyIncomeDto {
  title?: string;
  minAmount?: number;
  maxAmount?: number;
  priority?: number;
  active?: boolean;
}