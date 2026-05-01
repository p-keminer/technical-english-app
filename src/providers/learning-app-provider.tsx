import { useSQLiteContext } from 'expo-sqlite';
import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';

import { resetProgressAsync } from '@/lib/database';
import { getPrivateContentMeta, privateContentIsAvailable } from '@/lib/private-content';
import {
  getDashboardOverviewsAsync,
  getReviewSnapshotAsync,
  getSectionCardsAsync,
  getSectionDetailAsync,
  getSeedMetaAsync,
  getUnitVocabularySnapshotAsync,
  markTrackCompletedAsync,
  setUnitQuizStatusAsync,
  submitExerciseAnswerAsync,
  updateVocabStatusAsync,
} from '@/lib/repository';
import type {
  DashboardOverview,
  ExerciseSeed,
  PrivateContentMeta,
  ReviewSnapshot,
  SectionCard,
  SectionDetail,
  VocabStatus,
} from '@/types/content';

import { LearningAppContext } from './learning-app-context';

export function LearningAppProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [unitOverviews, setUnitOverviews] = useState<DashboardOverview[]>([]);
  const [sections, setSections] = useState<SectionCard[]>([]);
  const [sectionsByUnit, setSectionsByUnit] = useState<Record<string, SectionCard[]>>({});
  const [lastUnitRoute, setLastUnitRoute] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewSnapshot>({ exercises: [], vocabItems: [] });
  const [seedMeta, setSeedMeta] = useState<PrivateContentMeta>(getPrivateContentMeta());

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const nextUnitOverviews = await getDashboardOverviewsAsync(db);
      const nextOverview = nextUnitOverviews[0] ?? null;
      const sectionEntries = await Promise.all(
        nextUnitOverviews.map(async (unitOverview) => [
          unitOverview.unit.id,
          await getSectionCardsAsync(db, unitOverview.unit.id),
        ] as const)
      );
      const nextSectionsByUnit = Object.fromEntries(sectionEntries);
      const nextSections = nextOverview ? nextSectionsByUnit[nextOverview.unit.id] ?? [] : [];
      const nextReview = await getReviewSnapshotAsync(db);
      const nextSeedMeta = await getSeedMetaAsync(db);

      startTransition(() => {
        setOverview(nextOverview);
        setUnitOverviews(nextUnitOverviews);
        setSections(nextSections);
        setSectionsByUnit(nextSectionsByUnit);
        setReview(nextReview);
        setSeedMeta((current) => ({
          generatedAt: nextSeedMeta.generatedAt ?? current.generatedAt,
          sourcePdf: nextSeedMeta.sourcePdf ?? current.sourcePdf,
          notes: current.notes,
        }));
        setIsReady(true);
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      isReady,
      isRefreshing,
      hasPrivateContent: privateContentIsAvailable(),
      overview,
      unitOverviews,
      sections,
      sectionsByUnit,
      lastUnitRoute,
      setLastUnitRoute,
      review,
      seedMeta,
      refresh,
      getCachedSectionDetail: () => null,
      getCachedUnitVocabularySnapshot: () => null,
      getSectionDetail: async (sectionId: string): Promise<SectionDetail | null> => getSectionDetailAsync(db, sectionId),
      getUnitVocabularySnapshot: async (unitId: string) => getUnitVocabularySnapshotAsync(db, unitId),
      submitExerciseAnswer: async (exercise: ExerciseSeed, answer: unknown) => {
        const result = await submitExerciseAnswerAsync(db, exercise, answer);
        await refresh();
        return result;
      },
      updateVocabStatus: async (vocabId: string, status: VocabStatus) => {
        await updateVocabStatusAsync(db, vocabId, status);
        await refresh();
      },
      markTrackCompleted: async (trackId: string) => {
        await markTrackCompletedAsync(db, trackId);
        await refresh();
      },
      setUnitQuizStatus: async (unitId: string, status: 'passed' | 'skipped') => {
        await setUnitQuizStatusAsync(db, unitId, status);
        await refresh();
      },
      resetProgress: async () => {
        await resetProgressAsync(db);
        await refresh();
      },
    }),
    [
      db,
      isReady,
      isRefreshing,
      lastUnitRoute,
      overview,
      refresh,
      review,
      sections,
      sectionsByUnit,
      seedMeta,
      unitOverviews,
    ]
  );

  return <LearningAppContext.Provider value={value}>{children}</LearningAppContext.Provider>;
}

export { useLearningApp } from './learning-app-context';
