// question.types.ts

export interface CreateQuestionInput {
  key: string;
  title: string;
  category: 'DATING' | 'DATE_TO_MARRY' | 'MATURE_CONNECTION';
  screen:
    | 'LIFESTYLE'
    | 'REAL_U_MATTERS'
    | 'THINGS_U_LOVE'
    | 'INTEREST_HOBBY'
    | 'DREAM_PLAN';
  isMulti?: boolean;
  options: {
    value: string;
    label: string;
  }[];
}

export interface GetQuestionsQuery {
  category?: string;
  screen?: string;
}