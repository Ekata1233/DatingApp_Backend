export interface IIntention {
  title: string;
  description?: string;
  option?: string;
  optDescription?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface IUpdateIntention extends Partial<IIntention> {}