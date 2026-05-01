import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/constants/theme';

export function StatPill({
  label,
  value,
  tone = 'navy',
}: {
  label: string;
  value: string;
  tone?: 'navy' | 'signal' | 'mint';
}) {
  const toneMap = {
    navy: { background: '#C9DDF4', text: palette.navy },
    signal: { background: '#F3C7AE', text: palette.signal },
    mint: { background: '#C7E6DA', text: palette.mint },
  } as const;

  return (
    <View style={[styles.pill, { backgroundColor: toneMap[tone].background }]}>
      <Text style={[styles.value, { color: toneMap[tone].text }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  value: {
    fontSize: typography.cardTitle,
    fontWeight: '800',
  },
  label: {
    color: palette.slate,
    fontSize: typography.small,
  },
});
