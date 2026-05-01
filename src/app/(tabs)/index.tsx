import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
import { SetupRequired } from '@/components/setup-required';
import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useLearningApp } from '@/providers/learning-app-provider';

export default function StartScreen() {
  const { hasPrivateContent, isReady, overview, sectionsByUnit, unitOverviews } = useLearningApp();
  const activeOverview = unitOverviews.find((unitOverview) => unitOverview.continueSectionId) ?? overview;
  const activeSections = activeOverview ? sectionsByUnit[activeOverview.unit.id] ?? [] : [];
  const continueSection =
    activeSections.find((section) => section.id === activeOverview?.continueSectionId) ?? activeSections[0] ?? null;
  const allSections = unitOverviews.flatMap((unitOverview) => sectionsByUnit[unitOverview.unit.id] ?? []);
  const learnedVocabulary = unitOverviews.reduce((sum, unitOverview) => sum + unitOverview.learnedVocabulary, 0);
  const vocabularyTotal = unitOverviews.reduce((sum, unitOverview) => sum + unitOverview.vocabularyTotal, 0);
  const completedExercises = unitOverviews.reduce((sum, unitOverview) => sum + unitOverview.completedExercises, 0);
  const totalExercises = unitOverviews.reduce((sum, unitOverview) => sum + unitOverview.totalExercises, 0);

  if (!isReady) {
    return <LoadingState />;
  }

  if (!overview) {
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
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Technical English App</Text>
          <Text style={styles.title}>Deine Lernapp</Text>
          <Text style={styles.subtitle}>{unitOverviews.length} Units lokal verfuegbar</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Vokabeln"
            value={`${learnedVocabulary}/${vocabularyTotal}`}
            tone="mint"
          />
          <StatCard
            label="Uebungen"
            value={`${completedExercises}/${totalExercises}`}
            tone="signal"
          />
          <StatCard label="Abschnitte" value={`${allSections.length}`} tone="navy" />
        </View>

        {continueSection ? (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Heute weiter mit</Text>
            <Text style={styles.cardTitle}>{continueSection.title}</Text>
            <Text style={styles.cardText}>{continueSection.summaryDe}</Text>
            <PrimaryButton
              icon="play"
              label="Abschnitt oeffnen"
              onPress={() =>
                router.push({
                  pathname: '/section/[sectionId]',
                  params: { sectionId: continueSection.id },
                })
              }
            />
          </View>
        ) : null}

        <View style={styles.quickGrid}>
          <QuickAction
            icon="book-outline"
            title="Units"
            text="Alle Units in Buchreihenfolge."
            onPress={() => router.push('/unit')}
          />
          <QuickAction
            icon="library-outline"
            title="Vokabeln"
            text="Karteikarten und Abschlussquiz."
            onPress={() => router.push('/vocab')}
          />
          <QuickAction
            icon="bar-chart-outline"
            title="Fortschritt"
            text="Status je Abschnitt ansehen."
            onPress={() => router.push('/progress')}
          />
          <QuickAction
            icon="settings-outline"
            title="Setup"
            text="Lernfortschritt zuruecksetzen."
            onPress={() => router.push('/settings')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'mint' | 'navy' | 'signal' }) {
  const colorByTone = {
    mint: palette.mint,
    navy: palette.navy,
    signal: palette.signal,
  };

  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: colorByTone[tone] }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PrimaryButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={palette.cloud} />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function QuickAction({
  icon,
  onPress,
  text,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  text: string;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={22} color={palette.navy} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickText}>{text}</Text>
    </Pressable>
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
  hero: {
    backgroundColor: palette.navy,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.xl,
    ...shadows.card,
  },
  eyebrow: {
    color: '#F3C7AE',
    fontSize: typography.small,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.cloud,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: '#DDE8F5',
    fontSize: typography.body,
    lineHeight: 23,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.cloud,
    borderColor: palette.mist,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.card,
  },
  statValue: {
    fontSize: 25,
    fontWeight: '900',
  },
  statLabel: {
    color: palette.slate,
    fontSize: typography.small,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#F8D7BF',
    borderColor: '#E39B67',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardEyebrow: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '900',
  },
  cardText: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 23,
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.navy,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: palette.cloud,
    fontSize: typography.body,
    fontWeight: '800',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickCard: {
    width: '47.5%',
    backgroundColor: palette.cloud,
    borderColor: palette.mist,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    ...shadows.card,
  },
  quickIcon: {
    alignItems: 'center',
    backgroundColor: '#DDE8F5',
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  quickTitle: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '900',
  },
  quickText: {
    color: palette.slate,
    fontSize: typography.small,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.84,
  },
});
