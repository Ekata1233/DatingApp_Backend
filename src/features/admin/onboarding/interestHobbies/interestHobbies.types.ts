export type FlowType = "dating" | "marriage" | "mature";

export interface IInterestItem {
  name: string;
  icon: string;
}

export interface IInterestHobbies {
  _id?: string;
  flowType: FlowType;
  title: string;
  subtitle: string;
  items: IInterestItem[];

  createdAt?: string;
  updatedAt?: string;
}