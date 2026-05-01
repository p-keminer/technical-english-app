import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';

import { LoadingState } from '@/components/loading-state';
import {
  isSectionContentFocus,
  MissingSectionState,
  SectionDetailView,
} from '@/components/section-detail-view';
import { ScreenBackHeader } from '@/components/screen-back-header';
import { useLearningApp } from '@/providers/learning-app-provider';
import type { SectionDetail } from '@/types/content';

export default function SectionDetailScreen() {
  const { focus, sectionId } = useLocalSearchParams<{ focus?: string; sectionId: string }>();
  const router = useRouter();
  const app = useLearningApp();
  const { getSectionDetail, isReady, isRefreshing, markTrackCompleted, setLastUnitRoute, submitExerciseAnswer } = app;
  const [detail, setDetail] = useState<SectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSection = useCallback(async () => {
    if (!sectionId) {
      setDetail(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextDetail = await getSectionDetail(sectionId);
      setDetail(nextDetail);
    } finally {
      setIsLoading(false);
    }
  }, [getSectionDetail, sectionId]);

  useEffect(() => {
    let isCancelled = false;

    async function run() {
      if (!sectionId) {
        setDetail(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const nextDetail = await getSectionDetail(sectionId);
        if (!isCancelled) {
          setDetail(nextDetail);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();
    return () => {
      isCancelled = true;
    };
  }, [getSectionDetail, isRefreshing, sectionId]);

  useEffect(() => {
    if (detail) {
      setLastUnitRoute(`/section/${detail.section.id}`);
    }
  }, [detail, setLastUnitRoute]);

  if (isLoading || !isReady) {
    return <LoadingState label="Lade Abschnitt..." />;
  }

  const sectionHeader = detail ? (
    <ScreenBackHeader
      label={`Zurueck zu ${detail.section.bookSectionRef}`}
      onPress={() =>
        router.replace({
          pathname: '/unit/[unitId]',
          params: { unitId: detail.section.unitId },
        })
      }
    />
  ) : (
    <ScreenBackHeader label="Zurueck zu Units" onPress={() => router.replace('/unit')} />
  );

  if (!detail) {
    return <MissingSectionState header={sectionHeader} />;
  }

  return (
    <SectionDetailView
      detail={detail}
      header={sectionHeader}
      initialFocus={isSectionContentFocus(focus) ? focus : null}
      onTrackComplete={async (trackId) => {
        await markTrackCompleted(trackId);
        await loadSection();
      }}
      onExerciseSubmit={async (exercise, answer) => {
        const result = await submitExerciseAnswer(exercise, answer);
        await loadSection();
        return result;
      }}
    />
  );
}
