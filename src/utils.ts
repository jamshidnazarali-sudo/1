import { Question, Option } from './types';

export function parseTxtFile(content: string): Question[] {
  const lines = content.split('\n');
  const questions: Question[] = [];
  let currentQuestion: Partial<Question> | null = null;
  let options: Option[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#')) {
      // New question starts
      if (currentQuestion && options.length > 0) {
        questions.push(finalizeQuestion(currentQuestion as Question, options));
      }
      currentQuestion = {
        id: Math.random().toString(36).substr(2, 9),
        text: line.substring(1).trim(),
      };
      options = [];
    } else if (line.startsWith('+')) {
      options.push({
        id: Math.random().toString(36).substr(2, 9),
        text: line.substring(1).trim(),
        isCorrect: true,
      });
    } else if (line.startsWith('-')) {
      options.push({
        id: Math.random().toString(36).substr(2, 9),
        text: line.substring(1).trim(),
        isCorrect: false,
      });
    }
  }

  // Add the last question
  if (currentQuestion && options.length > 0) {
    questions.push(finalizeQuestion(currentQuestion as Question, options));
  }

  return questions;
}

function finalizeQuestion(q: Question, opts: Option[]): Question {
  const correctCount = opts.filter(o => o.isCorrect).length;
  let category = "";
  if (correctCount === 1) category = "1 correct answer";
  else if (correctCount === 2) category = "2 correct answers";
  else if (correctCount === 3) category = "3 correct answers";
  else category = "4+ correct answers";

  return {
    ...q,
    options: shuffleArray(opts),
    category,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
