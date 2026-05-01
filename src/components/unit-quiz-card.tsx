import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import type { UnitVocabularySnapshot } from '@/types/content';

export function UnitQuizCard({
  snapshot,
  onStart,
  onSkip,
}: {
  snapshot: UnitVocabularySnapshot;
  onStart: () => void;
  onSkip: () => void;
}) {
  const statusTone = {
    locked: palette.slate,
    ready: palette.signal,
    passed: palette.mint,
    skipped: palette.gold,
  } as const;

  const titleMap = {
    locked: 'Abschlussquiz noch gesperrt',
    ready: 'Abschlussquiz bereit',
    passed: 'Abschlussquiz bestanden',
    skipped: 'Abschlussquiz übersprungen',
  } as const;

  const textMap = {
    locked: 'Erst wenn alle Übungen der Unit erledigt sind, wird das Abschlussquiz freigeschaltet.',
    ready: 'Vor der Freigabe der Unit solltest du alle behandelten Vokabeln im Quiz vollständig richtig beantworten oder es bewusst überspringen.',
    passed: 'Die Unit ist freigegeben, weil du das Vokabelquiz vollständig gelöst hast.',
    skipped: 'Die Unit ist freigegeben, weil du das Vokabelquiz bewusst übersprungen hast.',
  } as const;

  return (
    <View style={styles.card}>
      <Text style={[styles.eyebrow, { color: statusTone[snapshot.quiz.status] }]}>Unit-Abschluss</Text>
      <Text style={styles.title}>{titleMap[snapshot.quiz.status]}</Text>
      <Text style={styles.body}>{textMap[snapshot.quiz.status]}</Text>
      <Text style={styles.meta}>
        {snapshot.learnedCount}/{snapshot.totalCount} Vokabeln als gemerkt markiert
      </Text>
      <Text style={styles.meta}>Quizumfang: {snapshot.quiz.totalQuestions} Fragen</Text>

      <View style={styles.actions}>
        <QuizButton
          label={snapshot.quiz.status === 'passed' ? 'Quiz erneut öffnen' : 'Quiz öffnen'}
          tone="navy"
          disabled={snapshot.quiz.status === 'locked'}
          onPress={onStart}
        />
        {snapshot.quiz.status === 'ready' ? (
          <QuizButton label="Explizit überspringen" tone="signal" onPress={onSkip} />
        ) : null}
      </View>
    </View>
  );
}

function QuizButton({
  label,
  tone,
  disabled,
  onPress,
}: {
  label: string;
  tone: 'navy' | 'signal';
  disabled?: boolean;
  onPress: () => void;
}) {
  const toneMap = {
    navy: { background: '#C9DDF4', text: palette.navy },
    signal: { background: '#F3C7AE', text: palette.signal },
  } as const;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: toneMap[tone].background },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
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
  eyebrow: {
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '800',
  },
  body: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  meta: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
});
