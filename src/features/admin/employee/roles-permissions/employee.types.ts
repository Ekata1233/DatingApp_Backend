
export interface CreateEmployeeRoleInput {
  roleName: string;
  description?: string;
}

export interface GetEmployeeRolesQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
export interface UpdateEmployeeRoleInput {
  roleName?: string;
  description?: string;
  isActive?: boolean;
}

export interface PermissionItem {
  module: string;

  all?: boolean;
  add?: boolean;
  view?: boolean;
  update?: boolean;
  delete?: boolean;
  export?: boolean;
}

export interface CreateRolePermissionInput {
  permissions: PermissionItem[];
}