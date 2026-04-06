export interface ILookingForItem {
  image: string;
  description: string;
  options?: string[]; // ✅ added
}

export interface ILookingFor {
   flowType: "dating" | "marriage" | "mature";
  title: string;
  items: ILookingForItem[];
}