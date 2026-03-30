export type FlowType = "dating" | "marriage" | "mature";

export interface IWorkingWith {
  name: string;
  workingAs: string[];
}

export interface IWorkDetails {
  _id?: string;
  flowType: FlowType;
  title: string;
  annualIncome: string[];
  workingWith: IWorkingWith[];

  createdAt?: string;
  updatedAt?: string;
}