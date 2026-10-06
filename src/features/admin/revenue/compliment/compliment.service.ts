import { prisma } from "../../../../prisma/prismaClient";
import { redis } from "../../../../lib/redis";
import { ICreateComplimentCategory, ICreateComplimentIdea, IUpdateComplimentCategory, IUpdateComplimentIdea } from "./compliment.types";


const ALL_CACHE_KEY = "compliment_category:all";
const ALL_IDEA_CACHE_KEY = "compliment_ideas:all";
const CACHE_TTL = 600; // 10 minutes
/**
 * Create Compliment Category
 */
export const createComplimentCategoryService = async (
  payload: ICreateComplimentCategory
) => {
  const existing = await prisma.complimentCategory.findUnique({
    where: {
      name: payload.name,
    },
  });

  if (existing) {
    throw new Error("Compliment category already exists");
  }

  const category = await prisma.complimentCategory.create({
    data: {
      name: payload.name,
      sortOrder: payload.sortOrder ?? 0,
    },
  });

  await redis.del(ALL_CACHE_KEY);

  return category;
};

/**
 * Get All Compliment Categories
 */
export const getAllComplimentCategoryService = async () => {
  const cache = await redis.get(ALL_CACHE_KEY);

  if (cache) {
    if (typeof cache === "string") {
      return JSON.parse(cache);
    }

    return cache;
  }

  const categories = await prisma.complimentCategory.findMany({
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  await redis.set(
    ALL_CACHE_KEY,
    JSON.stringify(categories),
    {
      ex: 60 * 60,
    }
  );

  return categories;
};

/**
 * Get Compliment Category By Id
 */
export const getComplimentCategoryByIdService = async (id: string) => {
  const CACHE_KEY = `compliment_category:${id}`;

const cached = await redis.get(CACHE_KEY);

if (cached) {
  console.log("✅ Compliment category from Redis");
  return cached;
}
  const category = await prisma.complimentCategory.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new Error("Compliment category not found");
  }
await redis.set(CACHE_KEY, category, {
  ex: CACHE_TTL,
});
  return category;
};

/**
 * Update Compliment Category
 */
export const updateComplimentCategoryService = async (
  id: string,
  payload: IUpdateComplimentCategory
) => {
  const category = await prisma.complimentCategory.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new Error("Compliment category not found");
  }

  if (payload.name) {
    const existing = await prisma.complimentCategory.findFirst({
      where: {
        name: payload.name,
        NOT: {
          id,
        },
      },
    });

    if (existing) {
      throw new Error("Compliment category already exists");
    }
  }

  const updated = await prisma.complimentCategory.update({
    where: {
      id,
    },
    data: payload,
  });

  await redis.del(ALL_CACHE_KEY);
await redis.del(`compliment_category:${id}`);
await redis.del(ALL_IDEA_CACHE_KEY);

return updated;
};

/**
 * Delete Compliment Category
 */
export const deleteComplimentCategoryService = async (id: string) => {
  const category = await prisma.complimentCategory.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new Error("Compliment category not found");
  }

  await prisma.complimentCategory.delete({
    where: {
      id,
    },
  });

  await redis.del(ALL_CACHE_KEY);
await redis.del(`compliment_category:${id}`);
  return {
    message: "Compliment category deleted successfully",
  };
};



// =====================================
// Create Compliment Idea
// =====================================

export const createComplimentIdeaService = async (
  payload: ICreateComplimentIdea
) => {

  const category = await prisma.complimentCategory.findUnique({
    where: {
      id: payload.categoryId,
    },
  });


  if (!category) {
    throw new Error("Compliment category not found");
  }




  const idea = await prisma.complimentIdea.create({
    data: {
      categoryId: payload.categoryId,
      text: payload.text,
      sortOrder: payload.sortOrder ?? 0,
    },
    include: {
      category: true,
    },
  });


  await redis.del(ALL_IDEA_CACHE_KEY);
await redis.del(
  `compliment_ideas:category:${payload.categoryId}`
);

  return idea;
};



// =====================================
// Get All Compliment Ideas
// =====================================

export const getAllComplimentIdeaService = async () => {
  const cache = await redis.get(ALL_IDEA_CACHE_KEY);

  if (cache) {
    if (typeof cache === "string") {
      return JSON.parse(cache);
    }

    return cache;
  }

  const ideas = await prisma.complimentIdea.findMany({
    include: {
      category: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  await redis.set(
    ALL_IDEA_CACHE_KEY,
    JSON.stringify(ideas),
    {
      ex: 60 * 60,
    }
  );

  return ideas;
};



// =====================================
// Get Ideas By Category
// =====================================

export const getComplimentIdeaByCategoryService = async (
  categoryId: string
) => {
const CACHE_KEY = `compliment_ideas:category:${categoryId}`;

const cached = await redis.get(CACHE_KEY);

if (cached) {
  console.log(
    `✅ Compliment ideas category ${categoryId} from Redis`
  );
  return cached;
}
  const category = await prisma.complimentCategory.findUnique({
    where: {
      id: categoryId,
    },
  });


  if (!category) {
    throw new Error("Compliment category not found");
  }


  const ideas = await prisma.complimentIdea.findMany({
    where: {
      categoryId,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

await redis.set(CACHE_KEY, ideas, {
  ex: CACHE_TTL,
});
  return ideas;
};



// =====================================
// Get Idea By ID
// =====================================

export const getComplimentIdeaByIdService = async (
  id: string
) => {
const CACHE_KEY = `compliment_idea:${id}`;

const cached = await redis.get(CACHE_KEY);

if (cached) {
  console.log("✅ Compliment idea from Redis");
  return cached;
}
  const idea = await prisma.complimentIdea.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
    },
  });


  if (!idea) {
    throw new Error("Compliment idea not found");
  }
await redis.set(CACHE_KEY, idea, {
  ex: CACHE_TTL,
});

  return idea;
};



// =====================================
// Update Compliment Idea
// =====================================

export const updateComplimentIdeaService = async (
  id: string,
  payload: IUpdateComplimentIdea
) => {


  const idea = await prisma.complimentIdea.findUnique({
    where: {
      id,
    },
  });

  if (!idea) {
    throw new Error("Compliment idea not found");
  }

  if (payload.categoryId) {

    const category = await prisma.complimentCategory.findUnique({
      where: {
        id: payload.categoryId,
      },
    });


    if (!category) {
      throw new Error("Compliment category not found");
    }

  }



  const updatedIdea = await prisma.complimentIdea.update({
    where: {
      id,
    },
    data: payload,
    include: {
      category: true,
    },
  });


await redis.del(ALL_IDEA_CACHE_KEY);

await redis.del(`compliment_idea:${id}`);

await redis.del(
  `compliment_ideas:category:${idea.categoryId}`
);

if (
  payload.categoryId &&
  payload.categoryId !== idea.categoryId
) {
  await redis.del(
    `compliment_ideas:category:${payload.categoryId}`
  );
}
  return updatedIdea;
};



// =====================================
// Delete Compliment Idea
// =====================================

export const deleteComplimentIdeaService = async (
  id: string
) => {


  const idea = await prisma.complimentIdea.findUnique({
    where: {
      id,
    },
  });


  if (!idea) {
    throw new Error("Compliment idea not found");
  }



  await prisma.complimentIdea.delete({
    where: {
      id,
    },
  });



  await redis.del(ALL_IDEA_CACHE_KEY);

await redis.del(`compliment_idea:${id}`);

await redis.del(
  `compliment_ideas:category:${idea.categoryId}`
);

  return {
    message: "Compliment idea deleted successfully",
  };
};