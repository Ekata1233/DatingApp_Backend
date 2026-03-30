export type FlowType = "dating" | "marriage" | "mature";

export interface IEducation {
  _id?: string;
  flowType: FlowType;
  title: string;
  subtitle: string;
  educations: string[];

  createdAt?: string;
  updatedAt?: string;
}