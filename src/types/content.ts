export type Difficulty = 'easy' | 'medium' | 'hard';
export type SolutionMode = 'instant' | 'reveal_after_submit';
export type ReviewableItemType = 'exercise' | 'vocab' | 'audio';
export type VocabStatus = 'new' | 'review' | 'learned';
export type ExerciseResult = 'correct' | 'incorrect' | 'unseen';
export type UnitQuizStatus = 'locked' | 'ready' | 'passed' | 'skipped';

export type ExerciseType =
  | 'multiple_choice'
  | 'matching'
  | 'cloze'
  | 'ordering'
  | 'short_answer'
  | 'listening_cloze';

export interface UnitSeed {
  id: string;
  title: string;
  subtitle: string;
  introDe: string;
  focusAreas: string[];
}

export interface GrammarTopicSeed {
  id: string;
  sectionId: string;
  title: string;
  explanationDe: string;
  examples: string[];
  quickTips: string[];
}

export interface VocabItemSeed {
  id: string;
  sectionId: string;
  term: string;
  translationDe: string;
  explanationDe: string;
  exampleEn: string;
  exampleDe: string;
  notesDe?: string;
}

export interface SectionSeed {
  id: string;
  unitId: string;
  position: number;
  title: string;
  subtitle: string;
  summaryDe: string;
  bookSectionRef: string;
  pageStart: number;
  pageEnd: number;
  grammarTopics: GrammarTopicSeed[];
}

export interface ListeningTrackSeed {
  id: string;
  sectionId: string;
  position: number;
  title: string;
  promptDe: string;
  transcriptText: string;
  sourceRef: string;
  assetKey: string;
}

export interface ExerciseSourceMaterial {
  title: string;
  body?: string;
  items?: string[];
  noteDe?: string;
}

export interface ExerciseSupportPayload {
  sourceMaterial?: ExerciseSourceMaterial[];
  wordBank?: string[];
}

export interface MultipleChoicePayload extends ExerciseSupportPayload {
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionIds: string[];
  allowMultiple?: boolean;
}

export interface MatchingPayload extends ExerciseSupportPayload {
  prompt: string;
  left: { id: string; label: string }[];
  right: { id: string; label: string }[];
  pairs: { leftId: string; rightId: string }[];
}

export interface ClozePayload extends ExerciseSupportPayload {
  prompt: string;
  text: string;
  blanks: {
    id: string;
    answer: string;
    alternatives?: string[];
    placeholder?: string;
  }[];
}

export interface OrderingPayload extends ExerciseSupportPayload {
  prompt: string;
  items: { id: string; label: string }[];
  correctOrder: string[];
}

export interface ShortAnswerPayload extends ExerciseSupportPayload {
  prompt: string;
  acceptedAnswers: string[];
  alternatives?: string[];
  placeholder?: string;
}

export interface ListeningClozePayload extends ClozePayload {
  trackId: string;
}

export type ExercisePayload =
  | MultipleChoicePayload
  | MatchingPayload
  | ClozePayload
  | OrderingPayload
  | ShortAnswerPayload
  | ListeningClozePayload;

export interface ExerciseSeed {
  id: string;
  sectionId: string;
  position: number;
  type: ExerciseType;
  title: string;
  instructionsDe: string;
  bookSectionRef: string;
  difficulty: Difficulty;
  solutionMode: SolutionMode;
  reviewEligible: boolean;
  explanationDe: string;
  payload: ExercisePayload;
}

export interface AnswerKeyEntry {
  exerciseId: string;
  summary: string;
}

export interface UnitSeedBundle {
  unit: UnitSeed;
  sections: SectionSeed[];
  vocabItems: VocabItemSeed[];
  exercises: ExerciseSeed[];
  listeningTracks: ListeningTrackSeed[];
  answerKey: AnswerKeyEntry[];
}

export interface PrivateContentMeta {
  generatedAt: string | null;
  sourcePdf: string | null;
  notes?: string | null;
}

export interface PrivateContentModule {
  hasPrivateContent: boolean;
  privateContentMeta: PrivateContentMeta;
  audioModules: Record<string, number>;
  unitSeedBundle: UnitSeedBundle | null;
  unitSeedBundles?: UnitSeedBundle[];
}

export interface SectionCard {
  id: string;
  title: string;
  subtitle: string;
  summaryDe: string;
  bookSectionRef: string;
  pageRangeLabel: string;
  exerciseTotal: number;
  exerciseCorrect: number;
  vocabTotal: number;
  vocabLearned: number;
  audioTotal: number;
  audioCompleted: number;
}

export interface DashboardOverview {
  unit: UnitSeed;
  reviewCount: number;
  learnedVocabulary: number;
  vocabularyTotal: number;
  completedExercises: number;
  totalExercises: number;
  continueSectionId: string | null;
}

export interface ReviewSnapshot {
  exercises: {
    id: string;
    title: string;
    sectionId: string;
    sectionTitle: string;
    explanationDe: string;
    type: ExerciseType;
  }[];
  vocabItems: {
    id: string;
    term: string;
    translationDe: string;
    exampleEn: string;
    status: VocabStatus;
  }[];
}

export interface SectionDetail {
  section: SectionSeed;
  vocabItems: (VocabItemSeed & { status: VocabStatus })[];
  exercises: (ExerciseSeed & { lastResult: ExerciseResult })[];
  listeningTracks: (ListeningTrackSeed & { completed: boolean })[];
}

export interface UnitVocabularyItem extends VocabItemSeed {
  status: VocabStatus;
  sectionTitle: string;
  sectionRef: string;
}

export interface UnitQuizSnapshot {
  unitId: string;
  status: UnitQuizStatus;
  totalQuestions: number;
  completedAt: string | null;
  unlockedBy: 'quiz' | 'skip' | null;
}

export interface UnitVocabularySnapshot {
  unit: UnitSeed;
  items: UnitVocabularyItem[];
  learnedCount: number;
  totalCount: number;
  quiz: UnitQuizSnapshot;
}
