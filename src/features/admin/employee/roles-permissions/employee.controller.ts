import { Request, Response } from "express";
import { createEmployeeRoleService, createRolePermissionService, deleteEmployeeRoleService, getEmployeeRolesService, getRolePermissionService,  updateEmployeeRoleService, updateRolePermissionService } from "./employee.service";
import { createEmployeeRoleSchema, createRolePermissionSchema,  updateEmployeeRoleSchema } from "./employee.validation";



export const createEmployeeRoleController = async (
  req: Request,
  res: Response
) => {
  try {
    const body = createEmployeeRoleSchema.parse(req.body);
    const role = await createEmployeeRoleService(body);
    return res.status(201).json({
      success: true,
      message: "Employee role created successfully.",
      data: role,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEmployeeRolesController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getEmployeeRolesService({
      page: req.query.page
        ? Number(req.query.page)
        : undefined,
      limit: req.query.limit
        ? Number(req.query.limit)
        : undefined,
      search: req.query.search as string,
      isActive:
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined,
    });
    return res.status(200).json({
      success: true,
      message: "Roles fetched successfully.",
      data: result.roles,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateEmployeeRoleController = async (
  req: Request,
  res: Response
) => {
  try {
    const body = updateEmployeeRoleSchema.parse(req.body);
    const role = await updateEmployeeRoleService(
      req.params.id as string,
      body
    );
    return res.status(200).json({
      success: true,
      message: "Employee role updated successfully.",
      data: role,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteEmployeeRoleController = async (
  req: Request,
  res: Response
) => {
  try {
    await deleteEmployeeRoleService(req.params.id as string);
    return res.status(200).json({
      success: true,
      message: "Employee role deleted successfully.",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const createRolePermissionController = async (
  req: Request,
  res: Response
) => {
  try {
    const body = createRolePermissionSchema.parse(req.body);
    const permissions =
      await createRolePermissionService(
        req.params.roleId as string,
        body
      );
    return res.status(201).json({
      success: true,
      message: "Role permissions assigned successfully.",
      data: permissions,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const getRolePermissionController = async (
  req: Request,
  res: Response
) => {
  try {
    const role = await getRolePermissionService(
      req.params.roleId as string
    );

    return res.status(200).json({
      success: true,
      message: "Role permissions fetched successfully.",
      data: role,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateRolePermissionController = async (
  req: Request,
  res: Response
) => {
  try {
    const body = createRolePermissionSchema.parse(req.body);

    const permissions = await updateRolePermissionService(
      req.params.roleId as string,
      body
    );

    return res.status(200).json({
      success: true,
      message: "Role permissions updated successfully.",
      data: permissions,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};