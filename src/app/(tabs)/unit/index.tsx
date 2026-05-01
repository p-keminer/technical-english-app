import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
import { SetupRequired } from '@/components/setup-required';
import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useLearningApp } from '@/providers/learning-app-provider';
import type { DashboardOverview } from '@/types/content';

export default function UnitScreen() {
  const { hasPrivateContent, isReady, setLastUnitRoute, unitOverviews } = useLearningApp();

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
        <View style={styles.header}>
          <Text style={styles.title}>Units</Text>
        </View>

        {unitOverviews.map((unitOverview) => (
          <UnitSelectionCard
            key={unitOverview.unit.id}
            overview={unitOverview}
            onPress={() => {
              setLastUnitRoute(`/unit/${unitOverview.unit.id}`);
              router.push({
                pathname: '/unit/[unitId]',
                params: { unitId: unitOverview.unit.id },
              });
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function UnitSelectionCard({ overview, onPress }: { overview: DashboardOverview; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.unitCard, pressed && styles.pressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.unitBadge}>
          <Text style={styles.unitBadgeText}>{overview.unit.id.replace('unit-', 'Unit ')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={palette.navy} />
      </View>

      <Text style={styles.unitTitle}>{overview.unit.title}</Text>
      <Text style={styles.unitSubtitle}>{overview.unit.subtitle}</Text>

      <View style={styles.metrics}>
        <Metric label="Vokabeln" value={`${overview.learnedVocabulary}/${overview.vocabularyTotal}`} />
        <Metric label="Uebungen" value={`${overview.completedExercises}/${overview.totalExercises}`} />
      </View>
    </Pressable>
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
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 140,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '800',
  },
  unitCard: {
    backgroundColor: palette.cloud,
    borderColor: palette.mist,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitBadge: {
    backgroundColor: '#DDE8F5',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  unitBadgeText: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  unitTitle: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '900',
  },
  unitSubtitle: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  pressed: {
    opacity: 0.86,
  },
});
