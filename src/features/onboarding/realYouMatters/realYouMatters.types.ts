export interface IRealYouMattersPoint {
  label: string;
}

export interface IRealYouMattersSection {
  subtitle: string;
  points: IRealYouMattersPoint[];
}

export interface IRealYouMatters {
  title: string;
  description: string;
  sections: IRealYouMattersSection[];
}
