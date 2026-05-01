import { createContext, useContext } from 'react';

import type {
  DashboardOverview,
  ExerciseSeed,
  PrivateContentMeta,
  ReviewSnapshot,
  SectionCard,
  SectionDetail,
  UnitVocabularySnapshot,
  VocabStatus,
} from '@/types/content';

export type LearningAppContextValue = {
  isReady: boolean;
  isRefreshing: boolean;
  hasPrivateContent: boolean;
  overview: DashboardOverview | null;
  unitOverviews: DashboardOverview[];
  sections: SectionCard[];
  sectionsByUnit: Record<string, SectionCard[]>;
  lastUnitRoute: string | null;
  setLastUnitRoute: (route: string | null) => void;
  review: ReviewSnapshot;
  seedMeta: PrivateContentMeta;
  refresh: () => Promise<void>;
  getCachedSectionDetail: (sectionId: string) => SectionDetail | null;
  getCachedUnitVocabularySnapshot: (unitId: string) => UnitVocabularySnapshot | null;
  getSectionDetail: (sectionId: string) => Promise<SectionDetail | null>;
  getUnitVocabularySnapshot: (unitId: string) => Promise<UnitVocabularySnapshot | null>;
  submitExerciseAnswer: (exercise: ExerciseSeed, answer: unknown) => Promise<'correct' | 'incorrect'>;
  updateVocabStatus: (vocabId: string, status: VocabStatus) => Promise<void>;
  markTrackCompleted: (trackId: string) => Promise<void>;
  setUnitQuizStatus: (unitId: string, status: 'passed' | 'skipped') => Promise<void>;
  resetProgress: () => Promise<void>;
};

export const LearningAppContext = createContext<LearningAppContextValue | null>(null);

export function useLearningApp() {
  const context = useContext(LearningAppContext);
  if (!context) {
    throw new Error('useLearningApp must be used inside LearningAppProvider.');
  }
  return context;
}
