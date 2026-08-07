import { prisma } from "../../../../prisma/prismaClient";
import { CreateCategoryDto, CreateFamilyIncomeDto, CreateMasterValueDto, UpdateCategoryDto, UpdateFamilyIncomeDto, UpdateMasterValueDto } from "./familyProfile.types";


export const createCategoryService = async (
  data: CreateCategoryDto   
) => {

  const existing = await prisma.masterCategory.findUnique({
    where: {
      code: data.code,
    },
  });

  if (existing) {
    throw new Error("Category code already exists");
  }
//hjfggfghfghf
  return prisma.masterCategory.create({
    data: {
      code: data.code,
      title: data.title,
    },
  });
};

export const updateCategoryService = async (
  id: number,
  data: UpdateCategoryDto
) => {
  const category = await prisma.masterCategory.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (data.code) {
    const existing = await prisma.masterCategory.findFirst({
      where: {
        code: data.code,
        NOT: {
          id,
        },
      },
    });

    if (existing) {
      throw new Error("Category code already exists");
    }
  }

  return prisma.masterCategory.update({
    where: { id },
    data,
  });
};

export const deleteCategoryService = async (id: number) => {
  const category = await prisma.masterCategory.findUnique({
    where: {
      id,
    },
    include: {
      values: true,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category.values.length > 0) {
    throw new Error(
      "Cannot delete category because it contains master values"
    );
  }

  return prisma.masterCategory.delete({
    where: {
      id,
    },
  });
};

export const getCategoriesService = async () => {
  return prisma.masterCategory.findMany({
    include: {
      _count: {
        select: {
          values: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const createMasterValueService = async (
  data: CreateMasterValueDto
) => {

  const category = await prisma.masterCategory.findUnique({
    where: {
      id: data.categoryId,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  return prisma.masterValue.create({
    data: {
      categoryId: data.categoryId,
      value: data.value,
      priority: data.priority ?? 0,
      active: data.active ?? true,
    },
    include: {
      category: true,
    },
  });
};

export const updateMasterValueService = async (
  id: number,
  data: UpdateMasterValueDto
) => {
  const masterValue = await prisma.masterValue.findUnique({
    where: {
      id,
    },
  });

  if (!masterValue) {
    throw new Error("Master value not found");
  }

  if (data.categoryId) {
    const category = await prisma.masterCategory.findUnique({
      where: {
        id: data.categoryId,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }
  }

  return prisma.masterValue.update({
    where: {
      id,
    },
    data,
    include: {
      category: true,
    },
  });
};

export const deleteMasterValueService = async (
  id: number
) => {
  const value = await prisma.masterValue.findUnique({
    where: {
      id,
    },
    include: {
      familyStatuses: true,
      familyTypes: true,
      fatherOccupations: true,
      fatherOrganisations: true,
      motherOccupations: true,
      motherOrganisations: true,
      siblingRelations: true,
      siblingOccupations: true,
      siblingMaritals: true,
      familyHomes: true,
      nativePlaces: true,
    },
  });

  if (!value) {
    throw new Error("Master value not found");
  }

  const isUsed =
    value.familyStatuses.length ||
    value.familyTypes.length ||
    value.fatherOccupations.length ||
    value.fatherOrganisations.length ||
    value.motherOccupations.length ||
    value.motherOrganisations.length ||
    
    value.siblingOccupations.length ||
    value.siblingMaritals.length ||
    value.familyHomes.length ||
    value.nativePlaces.length;

  if (isUsed) {
    throw new Error(
      "Cannot delete. This value is already used by user profiles."
    );
  }

  return prisma.masterValue.delete({
    where: {
      id,
    },
  });
};

export const getMasterValuesService = async () => {
  return prisma.masterValue.findMany({
    include: {
      category: true,
    },
    orderBy: [
      {
        categoryId: "asc",
      },
      {
        priority: "asc",
      },
    ],
  });
};

export const createFamilyIncomeService = async (
  data: CreateFamilyIncomeDto
) => {

  return prisma.familyIncome.create({
    data: {
      title: data.title,
      minAmount: data.minAmount,
      maxAmount: data.maxAmount,
      priority: data.priority ?? 0,
      active: data.active ?? true,
    },
  });
};

export const updateFamilyIncomeService = async (
  id: number,
  data: UpdateFamilyIncomeDto
) => {
  const income = await prisma.familyIncome.findUnique({
    where: {
      id,
    },
  });

  if (!income) {
    throw new Error("Family income not found");
  }

  return prisma.familyIncome.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteFamilyIncomeService = async (
  id: number
) => {
  const income = await prisma.familyIncome.findUnique({
    where: {
      id,
    },
    include: {
      userProfiles: true,
    },
  });

  if (!income) {
    throw new Error("Family income not found");
  }

  if (income.userProfiles.length > 0) {
    throw new Error(
      "Cannot delete. Family income is already assigned to users."
    );
  }

  return prisma.familyIncome.delete({
    where: {
      id,
    },
  });
};

export const getFamilyIncomeService = async () => {
  return prisma.familyIncome.findMany({
    orderBy: {
      priority: "asc",
    },
  });
};

const CATEGORY_MAP: Record<string, string> = {
  familyStatus: "FAMILY_STATUS",
  familyType: "FAMILY_TYPE",
  fatherOccupation: "FATHER_OCCUPATION",
  fatherOrganisation: "FATHER_ORGANISATION",
  motherOccupation: "MOTHER_OCCUPATION",
  motherOrganisation: "MOTHER_ORGANISATION",
  siblingtype: "SIBLING_TYPE",
  siblingOccupation: "SIBLING_OCCUPATION",
  siblingMarital: "SIBLING_MARITAL",
  familyHome: "FAMILY_HOME",
  nativePlace: "NATIVE_PLACE",
};

export const getFamilyOptionsService = async (type: string) => {
  if (!type) {
    throw new Error("Type is required");
  }

  // Family Income comes from a separate table
  if (type === "familyIncome") {
    const incomes = await prisma.familyIncome.findMany({
      where: {
        active: true,
      },
      orderBy: {
        priority: "asc",
      },
      select: {
        id: true,
        title: true,
      },
    });

    return incomes.map((item) => ({
      id: item.id,
      value: item.title,
    }));
  }

  const categoryCode = CATEGORY_MAP[type];

  if (!categoryCode) {
    throw new Error("Invalid type");
  }

  const category = await prisma.masterCategory.findUnique({
    where: {
      code: categoryCode,
    },
    select: {
      values: {
        where: {
          active: true,
        },
        orderBy: {
          priority: "asc",
        },
        select: {
          id: true,
          value: true,
        },
      },
    },
  });

  return category?.values ?? [];
};