import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import type { UnitVocabularyItem, VocabStatus } from '@/types/content';

const statusLabel: Record<VocabStatus, string> = {
  new: 'Neu',
  review: 'Wiederholen',
  learned: 'Gemerkt',
};

export function VocabFlashcard({
  item,
  isFlipped,
  index,
  total,
  onFlip,
  onStatusChange,
}: {
  item: UnitVocabularyItem;
  isFlipped: boolean;
  index: number;
  total: number;
  onFlip: () => void;
  onStatusChange: (status: VocabStatus) => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.metaRow}>
        <Text style={styles.counter}>
          Karte {index + 1}/{total}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{statusLabel[item.status]}</Text>
        </View>
      </View>

      <Pressable onPress={onFlip} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionRef}>{item.sectionRef}</Text>
          <Text style={styles.tapHint}>{isFlipped ? 'Nochmal tippen für Vorderseite' : 'Tippen zum Umdrehen'}</Text>
        </View>

        {isFlipped ? (
          <View style={styles.backFace}>
            <Text style={styles.translation}>{item.translationDe}</Text>
            <Text style={styles.body}>{item.explanationDe}</Text>
            <Text style={styles.exampleEn}>{item.exampleEn}</Text>
            <Text style={styles.exampleDe}>{item.exampleDe}</Text>
            <Text style={styles.sectionTitle}>{item.sectionTitle}</Text>
          </View>
        ) : (
          <View style={styles.frontFace}>
            <Text style={styles.term}>{item.term}</Text>
            <Text style={styles.frontSubtitle}>Welche Bedeutung und welcher Kontext gehören dazu?</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.actions}>
        <FlashAction label="Wiederholen" tone="signal" onPress={() => onStatusChange('review')} />
        <FlashAction label="Neu lassen" tone="navy" onPress={() => onStatusChange('new')} />
        <FlashAction label="Gemerkt" tone="mint" onPress={() => onStatusChange('learned')} />
      </View>
    </View>
  );
}

function FlashAction({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: 'navy' | 'signal' | 'mint';
  onPress: () => void;
}) {
  const toneMap = {
    navy: { background: '#C9DDF4', text: palette.navy },
    signal: { background: '#F3C7AE', text: palette.signal },
    mint: { background: '#C7E6DA', text: palette.mint },
  } as const;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionButton, { backgroundColor: toneMap[tone].background }, pressed && styles.cardPressed]}>
      <Text style={[styles.actionText, { color: toneMap[tone].text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  counter: {
    color: palette.slate,
    fontSize: typography.small,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#D0DDED',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: palette.slate,
    fontSize: typography.small,
    fontWeight: '700',
  },
  card: {
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    padding: spacing.xl,
    minHeight: 300,
    borderWidth: 1,
    borderColor: palette.mist,
    justifyContent: 'space-between',
    gap: spacing.lg,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.86,
  },
  cardHeader: {
    gap: spacing.xs,
  },
  sectionRef: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tapHint: {
    color: palette.slate,
    fontSize: typography.small,
  },
  frontFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  term: {
    color: palette.ink,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  frontSubtitle: {
    color: palette.slate,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  backFace: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  translation: {
    color: palette.navy,
    fontSize: 28,
    fontWeight: '800',
  },
  body: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  exampleEn: {
    color: palette.ink,
    fontSize: typography.body,
    fontStyle: 'italic',
  },
  exampleDe: {
    color: palette.slate,
    fontSize: typography.small,
    lineHeight: 20,
  },
  sectionTitle: {
    color: palette.gold,
    fontSize: typography.small,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionText: {
    fontSize: typography.small,
    fontWeight: '700',
  },
});
