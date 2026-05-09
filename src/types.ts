export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  category: string; // "1 correct", "2 correct", etc.
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isSubmitted: boolean;
}

export type TestState = 'upload' | 'testing' | 'results';
