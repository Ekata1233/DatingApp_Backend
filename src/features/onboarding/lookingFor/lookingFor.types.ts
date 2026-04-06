export interface ILookingForItem {
  image: string;
  description: string;
  options?: string[]; // ✅ added
}

export interface ILookingFor {
  title: string;
  items: ILookingForItem[];
}