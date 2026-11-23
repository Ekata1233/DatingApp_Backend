import { EventDurationType } from "@prisma/client";
import {
  CreateEventCategoryInput,
  UpdateEventCategoryInput,
} from "./event-category.types";

const DURATION_TYPES = Object.values(EventDurationType);

export class CategoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategoryValidationError";
  }
}

export const normalizeCategoryValue = (value: string) => {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const isPlainObject = (
  value: unknown
): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

const allowedFields = [
  "label",
  "value",
  "eventDurationType",
  "icon",
  "sortOrder",
  "isActive",
];

export const validateCategoryInput = (
  body: unknown,
  isUpdate = false
): CreateEventCategoryInput | UpdateEventCategoryInput => {
  if (!isPlainObject(body)) {
    throw new CategoryValidationError(
      "Request body must be an object"
    );
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length) {
    throw new CategoryValidationError(
      `Unknown fields: ${unknownFields.join(", ")}`
    );
  }

  if (isUpdate && Object.keys(body).length === 0) {
    throw new CategoryValidationError(
      "At least one field is required"
    );
  }

  const result: Record<string, unknown> = {};

  if (!isUpdate || body.label !== undefined) {
    if (
      typeof body.label !== "string" ||
      !body.label.trim() ||
      body.label.trim().length > 100
    ) {
      throw new CategoryValidationError(
        "Label must contain 1 to 100 characters"
      );
    }

    result.label = body.label.trim();
  }

  if (!isUpdate || body.value !== undefined) {
    if (
      typeof body.value !== "string" ||
      !body.value.trim()
    ) {
      throw new CategoryValidationError(
        "Valid category value is required"
      );
    }

    const value = normalizeCategoryValue(body.value);

    if (!value || value.length > 100) {
      throw new CategoryValidationError(
        "Invalid category value"
      );
    }

    result.value = value;
  }

  if (
    !isUpdate ||
    body.eventDurationType !== undefined
  ) {
    if (
      !DURATION_TYPES.includes(
        body.eventDurationType as EventDurationType
      )
    ) {
      throw new CategoryValidationError(
        "eventDurationType must be SINGLE_DAY, MULTI_DAY or BOTH"
      );
    }

    result.eventDurationType = body.eventDurationType;
  }

  if (body.icon !== undefined) {
    if (
      body.icon !== null &&
      (typeof body.icon !== "string" ||
        body.icon.length > 500)
    ) {
      throw new CategoryValidationError(
        "Icon must be a string or null"
      );
    }

    result.icon = body.icon;
  }

  if (body.sortOrder !== undefined) {
    if (
      !Number.isInteger(body.sortOrder) ||
      (body.sortOrder as number) < 0
    ) {
      throw new CategoryValidationError(
        "sortOrder must be a non-negative integer"
      );
    }

    result.sortOrder = body.sortOrder;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      throw new CategoryValidationError(
        "isActive must be boolean"
      );
    }

    result.isActive = body.isActive;
  }

  return result as unknown as
    | CreateEventCategoryInput
    | UpdateEventCategoryInput;
};