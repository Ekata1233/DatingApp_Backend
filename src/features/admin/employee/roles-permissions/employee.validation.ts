import { z } from "zod";



export const createEmployeeRoleSchema = z.object({
  roleName: z
    .string()
    .trim()
    .min(2, "Role name is required")
    .max(100),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),
});


export const updateEmployeeRoleSchema = z.object({
  roleName: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters.")
    .max(100)
    .optional(),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  isActive: z.boolean().optional(),
});


export const createRolePermissionSchema = z.object({
  permissions: z
    .array(
      z.object({
        module: z.string().trim().min(1),

        all: z.boolean().optional(),

        add: z.boolean().optional(),

        view: z.boolean().optional(),

        update: z.boolean().optional(),

        delete: z.boolean().optional(),

        export: z.boolean().optional(),
      })
    )
    .min(1, "At least one permission is required."),
});