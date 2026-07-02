export type FlowType = "dating" | "marriage" | "mature";

export interface IReligion {
  name: string;
  communities: string[]; // ✅ changed to string array
}

export interface IReligionData {
  _id?: string;
  flowType: FlowType;
  title: string;
  religions: IReligion[];

  createdAt?: string;
  updatedAt?: string;
}