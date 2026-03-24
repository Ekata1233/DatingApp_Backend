export interface ILookingForItem {
  image: string;
  description: string;
}

export interface ILookingFor {
  flowType: "dating" | "marriage" | "mature";
  title: string;
  items: ILookingForItem[];
}
