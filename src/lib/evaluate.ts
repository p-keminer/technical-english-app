import type {
  ClozePayload,
  ExercisePayload,
  ExerciseResult,
  ExerciseSeed,
  MatchingPayload,
  MultipleChoicePayload,
  OrderingPayload,
  ShortAnswerPayload,
} from '@/types/content';

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}"']/g, '')
    .replace(/\s+/g, ' ');
}

function evaluateMultipleChoice(payload: MultipleChoicePayload, answer: unknown) {
  const selected = Array.isArray(answer) ? [...new Set(answer.map(String))].sort() : [];
  const expected = [...payload.correctOptionIds].sort();
  return JSON.stringify(selected) === JSON.stringify(expected);
}

function evaluateMatching(payload: MatchingPayload, answer: unknown) {
  if (!answer || typeof answer !== 'object') {
    return false;
  }
  const candidate = answer as Record<string, string>;
  return payload.pairs.every((pair) => candidate[pair.leftId] === pair.rightId);
}

function evaluateCloze(payload: ClozePayload, answer: unknown) {
  if (!answer || typeof answer !== 'object') {
    return false;
  }
  const candidate = answer as Record<string, string>;
  return payload.blanks.every((blank) => {
    const userValue = normalizeText(candidate[blank.id] ?? '');
    const accepted = [blank.answer, ...(blank.alternatives ?? [])].map(normalizeText);
    return accepted.includes(userValue);
  });
}

function evaluateOrdering(payload: OrderingPayload, answer: unknown) {
  const candidate = Array.isArray(answer) ? answer.map(String) : [];
  return JSON.stringify(candidate) === JSON.stringify(payload.correctOrder);
}

function evaluateShortAnswer(payload: ShortAnswerPayload, answer: unknown) {
  if (typeof answer !== 'string') {
    return false;
  }
  const normalized = normalizeText(answer);
  const accepted = [...payload.acceptedAnswers, ...(payload.alternatives ?? [])].map(normalizeText);
  return accepted.includes(normalized);
}

export function evaluateExercise(exercise: ExerciseSeed, answer: unknown): ExerciseResult {
  const payload = exercise.payload as ExercisePayload;

  let isCorrect = false;
  switch (exercise.type) {
    case 'multiple_choice':
      isCorrect = evaluateMultipleChoice(payload as MultipleChoicePayload, answer);
      break;
    case 'matching':
      isCorrect = evaluateMatching(payload as MatchingPayload, answer);
      break;
    case 'cloze':
    case 'listening_cloze':
      isCorrect = evaluateCloze(payload as ClozePayload, answer);
      break;
    case 'ordering':
      isCorrect = evaluateOrdering(payload as OrderingPayload, answer);
      break;
    case 'short_answer':
      isCorrect = evaluateShortAnswer(payload as ShortAnswerPayload, answer);
      break;
    default:
      isCorrect = false;
  }

  return isCorrect ? 'correct' : 'incorrect';
}
