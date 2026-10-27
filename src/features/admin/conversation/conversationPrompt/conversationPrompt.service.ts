
import {
  Prisma,
} from "@prisma/client";

import {
  conversationPromptRepository as repo,
} from "./conversationPrompt.repository";

import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreatePromptInput,
  UpdatePromptInput,
} from "./conversationPrompt.validation";

const handlePrismaError = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      throw new Error("A record with this unique value already exists");
    }

    if (error.code === "P2025") {
      throw new Error("Record not found");
    }

    if (error.code === "P2003") {
      throw new Error("Invalid related record");
    }
  }

  throw error;
};

export const conversationPromptService = {

  // ==========================================
  // CATEGORY SERVICES
  // ==========================================

  async createCategory(data: CreateCategoryInput) {
    const existing = await repo.findCategoryBySlug(
      data.slug
    );

    if (existing) {
      throw new Error("Category slug already exists");
    }

    try {
      return await repo.createCategory(data);
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  
async getCategories(slug?: string) {
  return repo.getAllCategories(slug);
},


  async updateCategory(
    id: string,
    data: UpdateCategoryInput
  ) {
    const category = await repo.findCategoryById(id);

    if (!category) {
      throw new Error("Category not found");
    }

    if (data.slug && data.slug !== category.slug) {
      const existing = await repo.findCategoryBySlug(
        data.slug
      );

      if (existing) {
        throw new Error("Category slug already exists");
      }
    }

    try {
      return await repo.updateCategory(id, data);
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  async deleteCategory(id: string) {
    const category = await repo.findCategoryById(id);

    if (!category) {
      throw new Error("Category not found");
    }

    return repo.deactivateCategory(id);
  },

  // ==========================================
  // PROMPT SERVICES
  // ==========================================

  async createPrompt(data: CreatePromptInput) {
    const category = await repo.findCategoryById(
      data.categoryId
    );

    if (!category) {
      throw new Error("Category not found");
    }

    if (!category.isActive) {
      throw new Error("Cannot add prompt to inactive category");
    }

    try {
      return await repo.createPrompt(data);
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  async updatePrompt(
    id: string,
    data: UpdatePromptInput
  ) {
    const prompt = await repo.findPromptById(id);

    if (!prompt) {
      throw new Error("Prompt not found");
    }

    const targetCategoryId =
      data.categoryId ?? prompt.categoryId;

    const category = await repo.findCategoryById(
      targetCategoryId
    );

    if (!category) {
      throw new Error("Category not found");
    }

    if (!category.isActive && data.isActive !== false) {
      throw new Error(
        "Cannot assign an active prompt to an inactive category"
      );
    }

    try {
      return await repo.updatePrompt(id, data);
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  async deletePrompt(id: string) {
    const prompt = await repo.findPromptById(id);

    if (!prompt) {
      throw new Error("Prompt not found");
    }

    return repo.deactivatePrompt(id);
  },

  // ==========================================
  // USER SERVICES
  // ==========================================

  async getUserPrompts(category?: string) {
    const data =
      await repo.getActiveCategoriesWithPrompts(category);

    return data;
  },

  // ==========================================
  // ADMIN LIST
  // ==========================================

  async getAdminPrompts(query: {
    categoryId?: string;
    search?: string;
    cursor?: string;
    limit: number;
    isActive?: string;
  }) {
    return repo.getAdminPrompts({
      ...query,
      isActive:
        query.isActive === undefined
          ? undefined
          : query.isActive === "true",
    });
  },
};
