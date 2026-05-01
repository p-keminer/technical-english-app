import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { LoadingState } from '@/components/loading-state';
import { UnitQuizRunner } from '@/components/unit-quiz-runner';
import { useLearningApp } from '@/providers/learning-app-provider';
import type { UnitVocabularySnapshot } from '@/types/content';

export default function UnitQuizScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const app = useLearningApp();
  const { getCachedUnitVocabularySnapshot, getUnitVocabularySnapshot, isReady, setUnitQuizStatus } = app;
  const [snapshot, setSnapshot] = useState<UnitVocabularySnapshot | null>(
    unitId ? getCachedUnitVocabularySnapshot(unitId) : null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadSnapshot() {
      if (!unitId) {
        setSnapshot(null);
        setIsLoading(false);
        return;
      }

      const cached = getCachedUnitVocabularySnapshot(unitId);
      if (cached && !isCancelled) {
        setSnapshot(cached);
      }

      setIsLoading(true);
      try {
        const nextSnapshot = await getUnitVocabularySnapshot(unitId);
        if (!isCancelled) {
          setSnapshot(nextSnapshot);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSnapshot();
    return () => {
      isCancelled = true;
    };
  }, [getCachedUnitVocabularySnapshot, getUnitVocabularySnapshot, unitId]);

  if (isLoading || !isReady) {
    return <LoadingState label="Lade Abschlussquiz..." />;
  }

  if (!snapshot) {
    return <LoadingState label="Kein Unit-Quiz verfuegbar." />;
  }

  const resolvedUnitId = unitId ?? snapshot.unit.id;

  function returnToOrigin() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    router.replace('/vocab');
  }

  return (
    <UnitQuizRunner
      snapshot={snapshot}
      onBack={returnToOrigin}
      onPassed={async () => {
        await setUnitQuizStatus(resolvedUnitId, 'passed');
        returnToOrigin();
      }}
      onSkipped={async () => {
        await setUnitQuizStatus(resolvedUnitId, 'skipped');
        returnToOrigin();
      }}
    />
  );
}
