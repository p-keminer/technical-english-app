import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import type { VocabItemSeed, VocabStatus } from '@/types/content';

const statusLabel: Record<VocabStatus, string> = {
  new: 'Neu',
  review: 'Wiederholen',
  learned: 'Gelernt',
};

export function VocabCard({
  item,
  onStatusChange,
  showActions = true,
}: {
  item: VocabItemSeed & { status: VocabStatus };
  onStatusChange?: (status: VocabStatus) => void;
  showActions?: boolean;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!showActions) {
    return (
      <Pressable onPress={() => setIsFlipped((current) => !current)} style={({ pressed }) => [styles.flipCard, pressed && styles.pressed]}>
        {isFlipped ? (
          <View style={styles.flipBack}>
            <Text style={styles.backLabel}>Erklaerung</Text>
            <Text style={styles.body}>{item.explanationDe}</Text>
            <Text style={styles.exampleEn}>{item.exampleEn}</Text>
          </View>
        ) : (
          <View style={styles.flipFront}>
            <Text style={styles.term}>{item.term}</Text>
            <Text style={styles.translation}>{item.translationDe}</Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.term}>{item.term}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{statusLabel[item.status]}</Text>
        </View>
      </View>

      <Text style={styles.translation}>{item.translationDe}</Text>
      <Text style={styles.body}>{item.explanationDe}</Text>
      <Text style={styles.exampleEn}>{item.exampleEn}</Text>
      <Text style={styles.exampleDe}>{item.exampleDe}</Text>

      {showActions && onStatusChange ? (
        <View style={styles.actions}>
          <StatusButton label="Nochmal" tone="signal" onPress={() => onStatusChange('review')} />
          <StatusButton label="Neu lassen" tone="navy" onPress={() => onStatusChange('new')} />
          <StatusButton label="Sitzt" tone="mint" onPress={() => onStatusChange('learned')} />
        </View>
      ) : null}
    </View>
  );
}

function StatusButton({
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
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor: toneMap[tone].background }]}>
      <Text style={[styles.buttonText, { color: toneMap[tone].text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.mist,
    ...shadows.card,
  },
  flipCard: {
    minHeight: 180,
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.mist,
    padding: spacing.lg,
    justifyContent: 'center',
    ...shadows.card,
  },
  pressed: {
    opacity: 0.88,
  },
  flipFront: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  flipBack: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  term: {
    flex: 1,
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: '#D0DDED',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: palette.slate,
    fontSize: typography.small,
    fontWeight: '700',
  },
  translation: {
    color: palette.signal,
    fontSize: typography.body,
    fontWeight: '700',
  },
  backLabel: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.small,
    fontWeight: '700',
  },
});
