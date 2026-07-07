export interface CreateLanguageInput {
  name: string;
  priority?: number;
  active?: boolean;
}

export interface UpdateLanguageInput {
  name?: string;
  priority?: number;
  active?: boolean;
}