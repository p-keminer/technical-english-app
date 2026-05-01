import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import type { SectionCard as SectionCardModel } from '@/types/content';

export function SectionCard({
  section,
  onPress,
}: {
  section: SectionCardModel;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.sectionRef}>{section.bookSectionRef}</Text>
          <Text style={styles.title}>{section.title}</Text>
        </View>
        <View style={styles.pageBadge}>
          <Text style={styles.pageBadgeText}>{section.pageRangeLabel}</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric label="Uebungen" value={`${section.exerciseCorrect}/${section.exerciseTotal}`} />
        <Metric label="Vokabeln" value={`${section.vocabLearned}/${section.vocabTotal}`} />
        <Metric label="Audio" value={`${section.audioCompleted}/${section.audioTotal}`} />
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
  card: {
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.mist,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.88,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionRef: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '800',
  },
  pageBadge: {
    backgroundColor: '#C8DCF4',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  pageBadgeText: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    backgroundColor: '#D7E6F4',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
  },
  metricValue: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '800',
  },
  metricLabel: {
    color: palette.slate,
    fontSize: typography.small,
  },
});
