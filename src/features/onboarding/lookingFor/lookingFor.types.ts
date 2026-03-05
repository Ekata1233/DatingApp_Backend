export interface ILookingForItem {
  image: string;
  description: string;
}

export interface ILookingFor {
  title: string;
  items: ILookingForItem[];
}
