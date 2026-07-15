export interface ICreateComplimentCategory {
  name: string;
  sortOrder?: number;
}

export interface IUpdateComplimentCategory {
  name?: string;
  sortOrder?: number;
}


// ===============================
// Compliment Idea Types
// ===============================

export interface ICreateComplimentIdea {
  categoryId: string;
  text: string;
  sortOrder?: number;
}

export interface IUpdateComplimentIdea {
  categoryId?: string;
  text?: string;
  sortOrder?: number;
}