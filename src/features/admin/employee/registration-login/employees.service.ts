import bcrypt from "bcrypt";
import { LoginEmployeeInput, RegisterEmployeeInput } from "./employees.types";
import { prisma } from "../../../../prisma/prismaClient";
import { generateAccessToken } from "../../../../utils/jwt";

export const registerEmployeeService = async (
  data: RegisterEmployeeInput
) => {
  // Check email already exists
  const emailExists = await prisma.employee.findUnique({
    where: {
      email: data.email.trim().toLowerCase(),
    },
  });

  if (emailExists) {
    throw new Error("Email already exists.");
  }

  // Check phone already exists
  const phoneExists = await prisma.employee.findUnique({
    where: {
      phone: data.phone.trim(),
    },
  });

  if (phoneExists) {
    throw new Error("Phone already exists.");
  }

  // Check role exists and is active
  const role = await prisma.employeeRole.findFirst({
    where: {
      id: data.roleId,
      isActive: true,
    },
  });

  if (!role) {
    throw new Error("Role not found.");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create employee
  const employee = await prisma.employee.create({
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),

      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),

      password: hashedPassword,

      image: data.image ?? null,

      address: data.address?.trim() ?? null,

      identityType: data.identityType ?? null,
      identityNumber: data.identityNumber?.trim() ?? null,
      identityImage: data.identityImage ?? null,

      roleId: data.roleId,
    },
    include: {
      role: {
        select: {
          id: true,
          roleName: true,
          description: true,
        },
      },
    },
  });

  // Never return password
  const { password, ...employeeData } = employee;

  return employeeData;
};



export const loginEmployeeService = async (
  data: LoginEmployeeInput
) => {
  const employee =
    await prisma.employee.findFirst({
      where: {
        OR: [
          {
            email: data.email,
          },
          {
            phone: data.phone,
          },
        ],
      },

      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

  if (!employee) {
    throw new Error(
      "Invalid email/phone or password."
    );
  }

  if (!employee.isActive) {
    throw new Error(
      "Employee account is inactive."
    );
  }

  if (!employee.role.isActive) {
    throw new Error(
      "Employee role is inactive."
    );
  }

  const passwordMatched =
    await bcrypt.compare(
      data.password,
      employee.password
    );

  if (!passwordMatched) {
    throw new Error(
      "Invalid email/phone or password."
    );
  }

  const token = generateAccessToken(
    employee.id,
    employee.roleId
  );

  const { password, ...employeeData } =
    employee;

  return {
    employee: employeeData,
    accessToken: token,
  };
};    