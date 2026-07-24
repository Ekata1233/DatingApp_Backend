import { IdentityType } from "@prisma/client";

export interface RegisterEmployeeBody {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  password: string;

  address?: string;

  identityType?: IdentityType;
  identityNumber?: string;
  identityImage?: string;

  roleId: string;
}

export interface RegisterEmployeeInput
  extends RegisterEmployeeBody {
  image?: string;
}