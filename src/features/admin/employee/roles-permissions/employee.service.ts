
import { CreateEmployeeRoleInput, CreateRolePermissionInput, GetEmployeeRolesQuery, UpdateEmployeeRoleInput } from "./employee.types";
import { prisma } from "../../../../prisma/prismaClient";



export const createEmployeeRoleService = async (
  data: CreateEmployeeRoleInput
) => {
  // Normalize role name
  const roleName = data.roleName.trim();
  // Check duplicate role
  const existingRole = await prisma.employeeRole.findFirst({
    where: {
      roleName: {
        equals: roleName,
        mode: "insensitive",
      },
    },
  });
  if (existingRole) {
    throw new Error("Role already exists.");
  }
  // Create role
  const role = await prisma.employeeRole.create({
    data: {
      roleName,
      description: data.description,
    },
  });
  return role;
};

export const getEmployeeRolesService = async (
  query: GetEmployeeRolesQuery
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const where: any = {};
  if (query.search) {
    where.roleName = {
      contains: query.search.trim(),
      mode: "insensitive",
    };
  }
  if (typeof query.isActive === "boolean") {
    where.isActive = query.isActive;
  }
  const [roles, total] = await prisma.$transaction([
    prisma.employeeRole.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            employees: true,
            permissions: true,
          },
        },
      },
    }),
    prisma.employeeRole.count({
      where,
    }),
  ]);
  return {
    roles,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateEmployeeRoleService = async (
  roleId: string,
  data: UpdateEmployeeRoleInput
) => {
  // Check role exists
  const role = await prisma.employeeRole.findUnique({
    where: {
      id: roleId,
    },
  });
  if (!role) {
    throw new Error("Role not found.");
  }
  // Check duplicate role name
  if (data.roleName) {
    const existingRole = await prisma.employeeRole.findFirst({
      where: {
        roleName: {
          equals: data.roleName.trim(),
          mode: "insensitive",
        },
        NOT: {
          id: roleId,
        },
      },
    });
    if (existingRole) {
      throw new Error("Role name already exists.");
    }
  }
  const updatedRole = await prisma.employeeRole.update({
    where: {
      id: roleId,
    },
    data: {
      ...(data.roleName && {
        roleName: data.roleName.trim(),
      }),

      ...(data.description !== undefined && {
        description: data.description,
      }),

      ...(data.isActive !== undefined && {
        isActive: data.isActive,
      }),
    },
  });
  return updatedRole;
};

export const deleteEmployeeRoleService = async (roleId: string) => {
  // Check role exists
  const role = await prisma.employeeRole.findUnique({
    where: {
      id: roleId,
    },
    include: {
      _count: {
        select: {
          employees: true,
        },
      },
    },
  });
  if (!role) {
    throw new Error("Role not found.");
  }
  // Already deleted
  if (!role.isActive) {
    throw new Error("Role is already deleted.");
  }
  // Prevent deleting role assigned to employees
  if (role._count.employees > 0) {
    throw new Error(
      "This role is assigned to employees and cannot be deleted."
    );
  }
  // Soft Delete
  await prisma.employeeRole.update({
    where: {
      id: roleId,
    },
    data: {
      isActive: false,
    },
  });
  return;
};


export const createRolePermissionService = async (
  roleId: string,
  data: CreateRolePermissionInput
) => {
  // Check role exists
  const role = await prisma.employeeRole.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) {
    throw new Error("Role not found.");
  }

  // Prevent duplicate modules in request
  const modules = data.permissions.map((item) =>
    item.module.trim().toUpperCase()
  );

  const duplicateModules = modules.filter(
    (module, index) => modules.indexOf(module) !== index
  );

  if (duplicateModules.length > 0) {
    throw new Error(
      `Duplicate module: ${duplicateModules[0]}`
    );
  }

  // Replace old permissions with new ones
  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: {
        roleId,
      },
    });

    await tx.rolePermission.createMany({
      data: data.permissions.map((permission) => ({
        roleId,
        module: permission.module.trim().toUpperCase(),

        all: permission.all ?? false,
        add: permission.add ?? false,
        view: permission.view ?? false,
        update: permission.update ?? false,
        delete: permission.delete ?? false,
        export: permission.export ?? false,
      })),
    });
  });

  return prisma.rolePermission.findMany({
    where: {
      roleId,
    },
    orderBy: {
      module: "asc",
    },
  });
};


export const getRolePermissionService = async (
  roleId: string
) => {
  const role = await prisma.employeeRole.findUnique({
    where: {
      id: roleId,
    },
    include: {
      permissions: {
        orderBy: {
          module: "asc",
        },
      },
    },
  });

  if (!role) {
    throw new Error("Role not found.");
  }

  return role;
};

export const updateRolePermissionService = async (
  roleId: string,
  data: CreateRolePermissionInput
) => {
  const role = await prisma.employeeRole.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) {
    throw new Error("Role not found.");
  }

  const modules = data.permissions.map((item) =>
    item.module.trim().toUpperCase()
  );

  const duplicateModules = modules.filter(
    (module, index) => modules.indexOf(module) !== index
  );

  if (duplicateModules.length) {
    throw new Error(`Duplicate module: ${duplicateModules[0]}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: {
        roleId,
      },
    });

    await tx.rolePermission.createMany({
      data: data.permissions.map((item) => ({
        roleId,
        module: item.module.trim().toUpperCase(),
        all: item.all ?? false,
        add: item.add ?? false,
        view: item.view ?? false,
        update: item.update ?? false,
        delete: item.delete ?? false,
        export: item.export ?? false,
      })),
    });
  });

  return await prisma.rolePermission.findMany({
    where: {
      roleId,
    },
    orderBy: {
      module: "asc",
    },
  });
};