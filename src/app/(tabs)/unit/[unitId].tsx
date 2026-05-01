import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
import { ScreenBackHeader } from '@/components/screen-back-header';
import { SectionCard } from '@/components/section-card';
import { SetupRequired } from '@/components/setup-required';
import { UnitQuizCard } from '@/components/unit-quiz-card';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { useLearningApp } from '@/providers/learning-app-provider';
import type { UnitVocabularySnapshot } from '@/types/content';

export default function UnitDetailScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const {
    getCachedUnitVocabularySnapshot,
    getUnitVocabularySnapshot,
    hasPrivateContent,
    isReady,
    sectionsByUnit,
    setUnitQuizStatus,
    setLastUnitRoute,
    unitOverviews,
  } = useLearningApp();
  const overview = useMemo(
    () => unitOverviews.find((unitOverview) => unitOverview.unit.id === unitId) ?? null,
    [unitId, unitOverviews]
  );
  const sections = overview ? sectionsByUnit[overview.unit.id] ?? [] : [];
  const [vocabSnapshot, setVocabSnapshot] = useState<UnitVocabularySnapshot | null>(
    unitId ? getCachedUnitVocabularySnapshot(unitId) : null
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadSnapshot() {
      if (!unitId) {
        setVocabSnapshot(null);
        return;
      }

      const cached = getCachedUnitVocabularySnapshot(unitId);
      if (cached && !isCancelled) {
        setVocabSnapshot(cached);
      }

      const nextSnapshot = await getUnitVocabularySnapshot(unitId);
      if (!isCancelled) {
        setVocabSnapshot(nextSnapshot);
      }
    }

    void loadSnapshot();
    return () => {
      isCancelled = true;
    };
  }, [getCachedUnitVocabularySnapshot, getUnitVocabularySnapshot, unitId]);

  useEffect(() => {
    if (unitId) {
      setLastUnitRoute(`/unit/${unitId}`);
    }
  }, [setLastUnitRoute, unitId]);

  if (!isReady) {
    return <LoadingState />;
  }

  if (unitOverviews.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SetupRequired hasPrivateContent={hasPrivateContent} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!overview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScreenBackHeader label="Zurueck zu Units" onPress={() => router.replace('/unit')} />
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Unit nicht gefunden</Text>
            <Text style={styles.emptyText}>Diese Unit ist im lokalen Content-Seed nicht verfuegbar.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenBackHeader label="Zurueck zu Units" onPress={() => router.replace('/unit')} />

        <View style={styles.unitHeader}>
          <Text style={styles.unitEyebrow}>{overview.unit.id.replace('unit-', 'Unit ')}</Text>
          <Text style={styles.unitTitle}>{overview.unit.title}</Text>
          <Text style={styles.unitSubtitle}>{overview.unit.subtitle}</Text>
          <View style={styles.unitStats}>
            <Metric label="Abschnitte" value={`${sections.length}`} />
            <Metric label="Vokabeln" value={`${overview.learnedVocabulary}/${overview.vocabularyTotal}`} />
            <Metric label="Uebungen" value={`${overview.completedExercises}/${overview.totalExercises}`} />
          </View>
        </View>

        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            onPress={() => {
              setLastUnitRoute(`/section/${section.id}`);
              router.push({
                pathname: '/section/[sectionId]',
                params: { sectionId: section.id },
              });
            }}
          />
        ))}

        {vocabSnapshot ? (
          <UnitQuizCard
            snapshot={vocabSnapshot}
            onStart={() =>
              router.push({
                pathname: '/quiz/[unitId]',
                params: { unitId: vocabSnapshot.unit.id },
              })
            }
            onSkip={() => void setUnitQuizStatus(vocabSnapshot.unit.id, 'skipped')}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  scrollContent: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 140,
  },
  unitHeader: {
    backgroundColor: palette.cloud,
    borderColor: palette.mist,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  unitEyebrow: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  unitTitle: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '900',
  },
  unitSubtitle: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  unitStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metric: {
    flex: 1,
    backgroundColor: '#D7E6F4',
    borderRadius: radius.md,
    gap: 4,
    padding: spacing.sm,
  },
  metricValue: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '900',
  },
  metricLabel: {
    color: palette.slate,
    fontSize: typography.small,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: palette.cloud,
    borderColor: palette.mist,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '900',
  },
  emptyText: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
