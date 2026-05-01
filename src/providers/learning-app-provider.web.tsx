import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';

import { getPrivateContentMeta, getPrivateSeedBundles, privateContentIsAvailable } from '@/lib/private-content';
import {
  createInitialWebProgress,
  findBundleBySectionId,
  findBundleByUnitId,
  getDashboardOverviewsFromBundles,
  getReviewSnapshotFromBundles,
  getSectionsByUnitFromBundles,
  getSectionDetailFromBundle,
  getUnitVocabularySnapshotFromBundle,
  loadWebProgress,
  markTrackCompletedInWebState,
  saveWebProgress,
  setUnitQuizStatusInWebState,
  submitExerciseInWebState,
  updateVocabInWebState,
} from '@/lib/web-learning-store';
import type { ExerciseSeed, PrivateContentMeta, ReviewSnapshot, VocabStatus } from '@/types/content';

import { LearningAppContext } from './learning-app-context';

const LAST_UNIT_ROUTE_KEY = 'engineering-english-coach-last-unit-route-v1';

function emptyReview(): ReviewSnapshot {
  return { exercises: [], vocabItems: [] };
}

function getInitialLastUnitRoute() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage.getItem(LAST_UNIT_ROUTE_KEY);
}

export function LearningAppProvider({ children }: { children: React.ReactNode }) {
  const bundles = useMemo(() => getPrivateSeedBundles(), []);
  const [isReady] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [seedMeta] = useState<PrivateContentMeta>(getPrivateContentMeta());
  const [progress, setProgress] = useState(() => (bundles.length ? createInitialWebProgress(bundles) : null));
  const [lastUnitRoute, setLastUnitRouteState] = useState<string | null>(getInitialLastUnitRoute);

  const setLastUnitRoute = useCallback((route: string | null) => {
    setLastUnitRouteState(route);
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    if (route) {
      window.localStorage.setItem(LAST_UNIT_ROUTE_KEY, route);
    } else {
      window.localStorage.removeItem(LAST_UNIT_ROUTE_KEY);
    }
  }, []);

  useEffect(() => {
    if (bundles.length === 0) {
      return;
    }

    const nextProgress = loadWebProgress(bundles);
    startTransition(() => {
      setProgress(nextProgress);
    });
  }, [bundles]);

  useEffect(() => {
    if (bundles.length === 0 || !progress) {
      return;
    }

    saveWebProgress(bundles, progress);
  }, [bundles, progress]);

  const unitOverviews = useMemo(
    () => (progress ? getDashboardOverviewsFromBundles(bundles, progress) : []),
    [bundles, progress]
  );
  const overview = unitOverviews[0] ?? null;
  const sectionsByUnit = useMemo(
    () => (progress ? getSectionsByUnitFromBundles(bundles, progress) : {}),
    [bundles, progress]
  );
  const sections = useMemo(
    () => (overview ? sectionsByUnit[overview.unit.id] ?? [] : []),
    [overview, sectionsByUnit]
  );
  const review = useMemo(
    () => (progress ? getReviewSnapshotFromBundles(bundles, progress) : emptyReview()),
    [bundles, progress]
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await Promise.resolve();
    setIsRefreshing(false);
  };

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
      getCachedSectionDetail: (sectionId: string) =>
        progress
          ? getSectionDetailFromBundle(findBundleBySectionId(bundles, sectionId) ?? bundles[0], progress, sectionId)
          : null,
      getCachedUnitVocabularySnapshot: (unitId: string) =>
        progress
          ? getUnitVocabularySnapshotFromBundle(findBundleByUnitId(bundles, unitId) ?? bundles[0], progress, unitId)
          : null,
      getSectionDetail: async (sectionId: string) =>
        progress
          ? getSectionDetailFromBundle(findBundleBySectionId(bundles, sectionId) ?? bundles[0], progress, sectionId)
          : null,
      getUnitVocabularySnapshot: async (unitId: string) =>
        progress
          ? getUnitVocabularySnapshotFromBundle(findBundleByUnitId(bundles, unitId) ?? bundles[0], progress, unitId)
          : null,
      submitExerciseAnswer: async (exercise: ExerciseSeed, answer: unknown) => {
        if (!progress) {
          return 'incorrect' as const;
        }

        const { result, nextState } = submitExerciseInWebState(progress, exercise, answer);
        startTransition(() => {
          setProgress(nextState);
        });
        return result;
      },
      updateVocabStatus: async (vocabId: string, status: VocabStatus) => {
        if (!progress) {
          return;
        }
        startTransition(() => {
          setProgress(updateVocabInWebState(progress, vocabId, status));
        });
      },
      markTrackCompleted: async (trackId: string) => {
        if (!progress) {
          return;
        }
        startTransition(() => {
          setProgress(markTrackCompletedInWebState(progress, trackId));
        });
      },
      setUnitQuizStatus: async (unitId: string, status: 'passed' | 'skipped') => {
        if (!progress) {
          return;
        }
        startTransition(() => {
          setProgress(setUnitQuizStatusInWebState(progress, unitId, status));
        });
      },
      resetProgress: async () => {
        if (bundles.length === 0) {
          return;
        }
        startTransition(() => {
          setProgress(createInitialWebProgress(bundles));
        });
      },
    }),
    [
      bundles,
      isReady,
      isRefreshing,
      lastUnitRoute,
      overview,
      progress,
      review,
      sections,
      sectionsByUnit,
      seedMeta,
      setLastUnitRoute,
      unitOverviews,
    ]
  );

  return <LearningAppContext.Provider value={value}>{children}</LearningAppContext.Provider>;
}

export { useLearningApp } from './learning-app-context';
