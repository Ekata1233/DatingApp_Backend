export interface IIntentionOption {
  option: string;
  optDescription?: string;
}

export interface IIntention {
  title: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;

  options: IIntentionOption[];
}