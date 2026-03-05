export interface IThingsYouLovePoint {
  label: string;
}

export interface IThingsYouLoveSection {
  subtitle: string;
  points: IThingsYouLovePoint[];
}

export interface IThingsYouLove {
  title: string;
  description: string;
  sections: IThingsYouLoveSection[];
}
