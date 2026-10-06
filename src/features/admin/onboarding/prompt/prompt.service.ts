import { prisma } from "../../../../prisma/prismaClient";
import { CreatePromptCategoryDto, CreatePromptDto, UpdatePromptCategoryDto, UpdatePromptDto } from "./prompt.types";
import { redis } from "../../../../lib/redis";

const PROMPT_CATEGORY_CACHE_KEY = "prompt_category:all";
const PROMPT_CACHE_KEY = "prompt:all";
const ACTIVE_PROMPT_CACHE_KEY = "prompt:active";

const CACHE_TTL = 600; // 10 minutes
export const createPromptCategoryService = async (
  data: CreatePromptCategoryDto
) => {
  const existingCategory = await prisma.promptCategory.findUnique({
    where: {
      name: data.name,
    },
  });

  if (existingCategory) {
    throw new Error("Prompt category already exists.");
  }

  const category = await prisma.promptCategory.create({
  data,
});

await redis.del(PROMPT_CATEGORY_CACHE_KEY);
await redis.del(ACTIVE_PROMPT_CACHE_KEY);

return category;
};

export const updatePromptCategoryService = async (
  id: string,
  data: UpdatePromptCategoryDto
) => {
 const category = await prisma.promptCategory.update({
  where: {
    id,
  },
  data,
});

await redis.del(PROMPT_CATEGORY_CACHE_KEY);
await redis.del(PROMPT_CACHE_KEY);
await redis.del(ACTIVE_PROMPT_CACHE_KEY);

return category;
};

export const deletePromptCategoryService = async (id: string) => {
  const count = await prisma.prompt.count({
    where: {
      categoryId: id,
    },
  });
  if (count) {
    throw new Error("Category contains prompts.");
  }
  await prisma.promptCategory.delete({
    where: {
      id,
    },
  });
  await redis.del(PROMPT_CATEGORY_CACHE_KEY);
await redis.del(PROMPT_CACHE_KEY);
await redis.del(ACTIVE_PROMPT_CACHE_KEY);
};

export const getPromptCategoryService = async () => {
  const cached = await redis.get(PROMPT_CATEGORY_CACHE_KEY);

  if (cached) {
    if (typeof cached === "string") {
      return JSON.parse(cached);
    }

    return cached;
  }

  const categories = await prisma.promptCategory.findMany({
    include: {
      _count: {
        select: {
          prompts: true,
        },
      },
    },
    orderBy: {
      priority: "asc",
    },
  });

  await redis.set(
    PROMPT_CATEGORY_CACHE_KEY,
    JSON.stringify(categories),
    {
      ex: CACHE_TTL,
    }
  );

  return categories;
};

export const createPromptService = async (
  data: CreatePromptDto
) => {
  const prompt = await prisma.prompt.create({
  data,
  include: {
    category: true,
  },
});

await redis.del(PROMPT_CACHE_KEY);
await redis.del(PROMPT_CATEGORY_CACHE_KEY);
await redis.del(ACTIVE_PROMPT_CACHE_KEY);

return prompt;
};

export const updatePromptService = async (
  id: string,
  data: UpdatePromptDto
) => {
  const prompt = await prisma.prompt.update({
  where: {
    id,
  },
  data,
  include: {
    category: true,
  },
});

await redis.del(PROMPT_CACHE_KEY);
await redis.del(PROMPT_CATEGORY_CACHE_KEY);
await redis.del(ACTIVE_PROMPT_CACHE_KEY);

return prompt;
};

export const deletePromptService = async (
  id: string
) => {
  const count = await prisma.userPrompt.count({
    where: {
      promptId: id,
    },
  });
  if (count) {
    throw new Error("Prompt is already used by users.");
  }
  await prisma.prompt.delete({
    where: {
      id,
    },
  });
  await redis.del(PROMPT_CACHE_KEY);
await redis.del(PROMPT_CATEGORY_CACHE_KEY);
await redis.del(ACTIVE_PROMPT_CACHE_KEY);
};

export const getPromptService = async () => {
  const cached = await redis.get(PROMPT_CACHE_KEY);

  if (cached) {
    if (typeof cached === "string") {
      return JSON.parse(cached);
    }

    return cached;
  }

  const prompts = await prisma.prompt.findMany({
    include: {
      category: true,
      _count: {
        select: {
          userPrompts: true,
        },
      },
    },
    orderBy: [
      {
        category: {
          priority: "asc",
        },
      },
      {
        priority: "asc",
      },
    ],
  });

  await redis.set(
    PROMPT_CACHE_KEY,
    JSON.stringify(prompts),
    {
      ex: CACHE_TTL,
    }
  );

  return prompts;
};

export const getActivePromptsService = async () => {
  const cached = await redis.get(ACTIVE_PROMPT_CACHE_KEY);

  if (cached) {
    if (typeof cached === "string") {
      return JSON.parse(cached);
    }

    return cached;
  }

  const activePrompts = await prisma.promptCategory.findMany({
    where: {
      active: true,
    },
    include: {
      prompts: {
        where: {
          active: true,
        },
        orderBy: {
          priority: "asc",
        },
      },
    },
    orderBy: {
      priority: "asc",
    },
  });

  await redis.set(
    ACTIVE_PROMPT_CACHE_KEY,
    JSON.stringify(activePrompts),
    {
      ex: CACHE_TTL,
    }
  );

  return activePrompts;
};