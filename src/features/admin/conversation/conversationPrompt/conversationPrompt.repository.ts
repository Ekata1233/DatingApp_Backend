
import { Prisma } from "@prisma/client";


import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreatePromptInput,
  UpdatePromptInput,
} from "./conversationPrompt.validation";
import { prisma } from "../../../../prisma/prismaClient";

export const conversationPromptRepository = {

  // ==========================================
  // CATEGORY
  // ==========================================

  createCategory(data: CreateCategoryInput) {
    return prisma.conversationPromptCategory.create({
      data,
    });
  },

  findCategoryById(id: string) {
    return prisma.conversationPromptCategory.findUnique({
      where: { id },
    });
  },

  findCategoryBySlug(slug: string) {
    return prisma.conversationPromptCategory.findUnique({
      where: { slug },
    });
  },

 

getAllCategories(slug?: string) {
  return prisma.conversationPromptCategory.findMany({
    where: {
      ...(slug ? { slug } : {}),
    },

    orderBy: [
      { sortOrder: "asc" },
      { id: "asc" },
    ],

    include: {
      // All prompts belonging to this category
      prompts: {
        orderBy: [
          { sortOrder: "asc" },
          { id: "asc" },
        ],
        select: {
          id: true,
          categoryId: true,
          message: true,
          label: true,
          sortOrder: true,
          isActive: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      // Total number of prompts
      _count: {
        select: {
          prompts: true,
        },
      },
    },
  });
},



  updateCategory(
    id: string,
    data: UpdateCategoryInput
  ) {
    return prisma.conversationPromptCategory.update({
      where: { id },
      data,
    });
  },

  // Soft delete category and its prompts
  async deactivateCategory(id: string) {
    return prisma.$transaction(async (tx) => {
      const category =
        await tx.conversationPromptCategory.update({
          where: { id },
          data: { isActive: false },
        });

      await tx.conversationPrompt.updateMany({
        where: { categoryId: id },
        data: { isActive: false },
      });

      return category;
    });
  },

  // ==========================================
  // PROMPTS
  // ==========================================

  createPrompt(data: CreatePromptInput) {
    return prisma.conversationPrompt.create({
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  },

  findPromptById(id: string) {
    return prisma.conversationPrompt.findUnique({
      where: { id },
    });
  },

  updatePrompt(
    id: string,
    data: UpdatePromptInput
  ) {
    return prisma.conversationPrompt.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  },

  deactivatePrompt(id: string) {
    return prisma.conversationPrompt.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // ==========================================
  // USER - ACTIVE CATEGORIES AND PROMPTS
  // ==========================================

  getActiveCategoriesWithPrompts(slug?: string) {
    return prisma.conversationPromptCategory.findMany({
      where: {
        isActive: true,
        ...(slug ? { slug } : {}),
      },

      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,

        prompts: {
          where: {
            isActive: true,
          },

          select: {
            id: true,
            message: true,
            label: true,
            sortOrder: true,
          },

          orderBy: [
            { sortOrder: "asc" },
            { id: "asc" },
          ],
        },
      },

      orderBy: [
        { sortOrder: "asc" },
        { id: "asc" },
      ],
    });
  },

  // ==========================================
  // ADMIN - PROMPT LIST
  // ==========================================

  async getAdminPrompts(query: {
    categoryId?: string;
    search?: string;
    cursor?: string;
    limit: number;
    isActive?: boolean;
  }) {
    const {
      categoryId,
      search,
      cursor,
      limit,
      isActive,
    } = query;

    const where: Prisma.ConversationPromptWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),

      ...(search
        ? {
            OR: [
              {
                message: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                label: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const prompts = await prisma.conversationPrompt.findMany({
      where,
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),

      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],

      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const hasMore = prompts.length > limit;
    const data = prompts.slice(0, limit);

    return {
      data,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore
          ? data[data.length - 1].id
          : null,
      },
    };
  },
};
