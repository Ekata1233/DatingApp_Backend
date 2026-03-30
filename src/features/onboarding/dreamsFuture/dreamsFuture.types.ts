export type FlowType = "dating" | "marriage" | "mature";

export interface IDreamItem {
  name: string;
  icon: string;
}

export interface IDreamsFuture {
  _id?: string;
  flowType: FlowType;
  title: string;
  subtitle: string;
  items: IDreamItem[];

  createdAt?: string;
  updatedAt?: string;
}