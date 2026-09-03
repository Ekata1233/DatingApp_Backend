
import {
  LegalDocumentContent,
} from "./legal.types";
import { renderBlocksToHtml } from "./legal.render";
import { prisma } from "../../prisma/prismaClient";
import { LegalPageType, Prisma } from "@prisma/client";

export async function upsertLegalPageService(
  pageType: LegalPageType,
  title: string,
  content: LegalDocumentContent,
) {
  /* HTML server pe generate hota hai — client se kabhi accept nahi.
     DB me content = { schemaVersion, blocks, html } save hota hai.
     GET pe app/website ko ready-made html milta hai. */
  const contentWithHtml: LegalDocumentContent = {
    schemaVersion: content.schemaVersion,
    blocks: content.blocks,
    html: renderBlocksToHtml(content.blocks),
  };

  const existingPage = await prisma.legalPage.findFirst({
    where: {
      pageType,
    },
  });

  if (existingPage) {
    return prisma.legalPage.update({
      where: {
        id: existingPage.id,
      },
      data: {
        title: title.trim(),
        content: contentWithHtml as unknown as Prisma.InputJsonValue,
        schemaVersion: content.schemaVersion,
        effectiveFrom: existingPage.effectiveFrom ?? new Date(),
        publishedAt: new Date(),
      },
    });
  }

  return prisma.legalPage.create({
    data: {
      pageType,
      title: title.trim(),
      version: "1.0",
      content: contentWithHtml as unknown as Prisma.InputJsonValue,
      schemaVersion: content.schemaVersion,
      effectiveFrom: new Date(),
      publishedAt: new Date(),
    },
  });
}

export async function getAllLegalPagesService() {
  return prisma.legalPage.findMany({
    orderBy: {
      pageType: "asc",
    },
  });
}

export async function getLegalPageByTypeService(
  pageType: LegalPageType,
) {
  return prisma.legalPage.findUnique({
    where: {
      pageType,
    },
  });
}