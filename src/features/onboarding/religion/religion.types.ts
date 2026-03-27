export type FlowType = "dating" | "marriage" | "mature";

export interface ICommunity {
  name: string;
}

export interface IReligion {
  name: string;
  communities: ICommunity[];
}

export interface IReligionData {
  _id?: string;
  flowType: FlowType;
  title: string;
  religions: IReligion[];

  createdAt?: string;
  updatedAt?: string;
}

// ✅ payload (for create/update)
export type CreateReligionPayload = Omit<
  IReligionData,
  "_id" | "createdAt" | "updatedAt"
>;