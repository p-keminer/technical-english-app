import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
import { SetupRequired } from '@/components/setup-required';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { useLearningApp } from '@/providers/learning-app-provider';

export default function ProgressScreen() {
  const { hasPrivateContent, isReady, sectionsByUnit, unitOverviews } = useLearningApp();

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Fortschritt</Text>
        <Text style={styles.subtitle}>Du siehst hier pro Abschnitt, wie weit Grammatik, Uebungen und Audio sind.</Text>

        {unitOverviews.map((unitOverview) => (
          <View key={unitOverview.unit.id} style={styles.unitGroup}>
            <Text style={styles.unitTitle}>{unitOverview.unit.title}</Text>
            {(sectionsByUnit[unitOverview.unit.id] ?? []).map((section) => {
              const exerciseRatio = section.exerciseTotal ? section.exerciseCorrect / section.exerciseTotal : 0;
              const vocabRatio = section.vocabTotal ? section.vocabLearned / section.vocabTotal : 0;
              const audioRatio = section.audioTotal ? section.audioCompleted / section.audioTotal : 0;

              return (
                <View key={section.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{section.title}</Text>
                  <ProgressLine label="Uebungen" ratio={exerciseRatio} />
                  <ProgressLine label="Vokabeln" ratio={vocabRatio} />
                  <ProgressLine label="Audio" ratio={audioRatio} />
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressLine({ label, ratio }: { label: string; ratio: number }) {
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.progressValue}>{Math.round(ratio * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 140,
  },
  title: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  unitGroup: {
    gap: spacing.md,
  },
  unitTitle: {
    color: palette.signal,
    fontSize: typography.cardTitle,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.mist,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '800',
  },
  progressRow: {
    gap: spacing.xs,
  },
  progressLabel: {
    color: palette.slate,
    fontSize: typography.small,
    fontWeight: '700',
  },
  progressTrack: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: '#E8EEF5',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: palette.signal,
  },
  progressValue: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '700',
  },
});
