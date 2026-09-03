import { LegalPageType } from "@prisma/client";

export type LegalTextMark = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  link?: string;
};

export type LegalHeadingBlock = {
  type: "heading";
  level: 1 | 2 | 3 | 4;
  content: LegalTextMark[];
};

export type LegalParagraphBlock = {
  type: "paragraph";
  content: LegalTextMark[];
};

export type LegalListItem = {
  content: LegalTextMark[];
};

export type LegalBulletListBlock = {
  type: "bulletList";
  items: LegalListItem[];
};

export type LegalNumberedListBlock = {
  type: "numberedList";
  items: LegalListItem[];
};

export type LegalTableCell = {
  content: LegalTextMark[];
};

export type LegalTableRow = {
  cells: LegalTableCell[];
};

export type LegalTableBlock = {
  type: "table";
  id?: string;
  headers: LegalTableCell[];
  rows: LegalTableRow[];
};

export type LegalQuoteBlock = {
  type: "quote";
  content: LegalTextMark[];
};

export type LegalDividerBlock = {
  type: "divider";
};

export type LegalBlock =
  | LegalHeadingBlock
  | LegalParagraphBlock
  | LegalBulletListBlock
  | LegalNumberedListBlock
  | LegalTableBlock
  | LegalQuoteBlock
  | LegalDividerBlock;

export type LegalDocumentContent = {
  schemaVersion: number;
  blocks: LegalBlock[];
  /**
   * Server-generated HTML — display copy of blocks.
   * Frontend/app ise directly render karte hain (h1-h4, p, ul, ol,
   * blockquote, hr, table + color/bold/italic/underline spans).
   * Ye field kabhi client se accept NAHI hoti — backend
   * renderBlocksToHtml() se khud banata hai (XSS-safe).
   */
  html?: string;
};

export interface CreateLegalPageRequest {
  pageType: LegalPageType;
  title: string;
  content: LegalDocumentContent;
}