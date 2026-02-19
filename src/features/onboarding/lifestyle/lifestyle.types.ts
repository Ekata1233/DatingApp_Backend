export interface ILifestylePoint {
  label: string;
}

export interface ILifestyleSection {
  subtitle: string;
  points: ILifestylePoint[];
}

export interface ILifestyle {
  title: string;
  description: string;
  sections: ILifestyleSection[];
}
