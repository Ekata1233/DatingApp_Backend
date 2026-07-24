import { Router } from "express";
import { createEmployeeRoleController, createRolePermissionController, deleteEmployeeRoleController, getEmployeeRolesController, getRolePermissionController,  updateEmployeeRoleController, updateRolePermissionController } from "./employee.controller";

const router = Router();


router.post("/employee-role/create", createEmployeeRoleController);
router.get("/employee-role/get", getEmployeeRolesController);
router.patch("/employee-role/update/:id", updateEmployeeRoleController);
router.delete("/employee-role/delete/:id", deleteEmployeeRoleController);
router.post(
  "/employee-role/:roleId/permissions",
  createRolePermissionController
);
router.get(
  "/employee-role/:roleId/permissions/get",
  getRolePermissionController
);
router.patch(
  "/employee-role/:roleId/permissions/update",
  updateRolePermissionController
);
export default router;