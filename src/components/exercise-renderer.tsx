import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import type {
  ClozePayload,
  ExerciseResult,
  ExerciseSeed,
  ExerciseSupportPayload,
  ListeningClozePayload,
  MatchingPayload,
  MultipleChoicePayload,
  OrderingPayload,
  ShortAnswerPayload,
} from '@/types/content';

type ExerciseRendererProps = {
  exercise: ExerciseSeed & { lastResult: ExerciseResult };
  onSubmit: (answer: unknown) => Promise<ExerciseResult>;
  variant?: 'card' | 'embedded';
};

type ClozeAnswerMap = Record<string, string>;

type InlineClozeSegment =
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'blank';
      blank: ClozePayload['blanks'][number];
      index: number;
    };

function buildInlineClozeSegments(payload: ClozePayload): InlineClozeSegment[] {
  return payload.text
    .split(/(\[\d+\])/g)
    .filter(Boolean)
    .map((segment) => {
      const match = segment.match(/^\[(\d+)\]$/);
      if (!match) {
        return { type: 'text', value: segment } as const;
      }

      const index = Number(match[1]) - 1;
      return {
        type: 'blank',
        blank: payload.blanks[index],
        index,
      } as const;
    });
}

function formatTrackLabel(trackId: string) {
  if (trackId.startsWith('track-')) {
    const numericPart = trackId.replace('track-', '').split('-').join('.');
    return `Track ${numericPart}`;
  }

  return trackId;
}

const matchTones = [
  { background: '#F7C9AE', border: '#C94D13', accent: '#C94D13' },
  { background: '#C9DDF4', border: '#4673AE', accent: '#4673AE' },
  { background: '#C7E6DA', border: '#3F8C6C', accent: '#3F8C6C' },
  { background: '#EBCF9C', border: '#A97510', accent: '#A97510' },
  { background: '#E3CCF2', border: '#8755B8', accent: '#8755B8' },
  { background: '#F2C5CD', border: '#C44A5B', accent: '#C44A5B' },
] as const;

function toneForMatch(index: number) {
  return matchTones[index % matchTones.length];
}

export function ExerciseRenderer({ exercise, onSubmit, variant = 'card' }: ExerciseRendererProps) {
  const [result, setResult] = useState<ExerciseResult>(exercise.lastResult);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSolution, setShowSolution] = useState(exercise.lastResult !== 'unseen');
  const [attemptVersion, setAttemptVersion] = useState(0);
  const [completedForProgress, setCompletedForProgress] = useState(exercise.lastResult === 'correct');

  useEffect(() => {
    setResult(exercise.lastResult);
    setShowSolution(exercise.lastResult !== 'unseen');
    setAttemptVersion(0);
    setCompletedForProgress(exercise.lastResult === 'correct');
  }, [exercise.id, exercise.lastResult]);

  async function handleSubmit(answer: unknown) {
    setIsSubmitting(true);
    try {
      const nextResult = await onSubmit(answer);
      setResult(nextResult);
      setShowSolution(true);
      if (nextResult === 'correct') {
        setCompletedForProgress(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function restartExercise() {
    setResult('unseen');
    setShowSolution(false);
    setAttemptVersion((current) => current + 1);
  }

  return (
    <View style={[styles.card, variant === 'embedded' && styles.cardEmbedded]}>
      <Text style={styles.typeLabel}>{exercise.bookSectionRef}</Text>
      <Text style={styles.title}>{exercise.title}</Text>
      <Text style={styles.instructions}>{exercise.instructionsDe}</Text>
      <ExerciseSupportMaterial payload={exercise.payload as ExerciseSupportPayload} />

      {exercise.type === 'multiple_choice' ? (
        <MultipleChoiceExercise
          key={`${exercise.id}-multiple_choice-${attemptVersion}`}
          exercise={exercise}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      ) : null}
      {exercise.type === 'matching' ? (
        <MatchingExercise
          key={`${exercise.id}-matching-${attemptVersion}`}
          exercise={exercise}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      ) : null}
      {exercise.type === 'cloze' ? (
        <ClozeExercise
          key={`${exercise.id}-cloze-${attemptVersion}`}
          exercise={exercise}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      ) : null}
      {exercise.type === 'ordering' ? (
        <OrderingExercise
          key={`${exercise.id}-ordering-${attemptVersion}`}
          exercise={exercise}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      ) : null}
      {exercise.type === 'short_answer' ? (
        <ShortAnswerExercise
          key={`${exercise.id}-short_answer-${attemptVersion}`}
          exercise={exercise}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      ) : null}
      {exercise.type === 'listening_cloze' ? (
        <ListeningClozeExercise
          key={`${exercise.id}-listening_cloze-${attemptVersion}`}
          exercise={exercise}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      ) : null}

      {result !== 'unseen' ? (
        <View style={[styles.feedback, result === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
          <Text style={styles.feedbackTitle}>{result === 'correct' ? 'Richtig' : 'Noch nicht ganz'}</Text>
          <Text style={styles.feedbackText}>
            {result === 'correct'
              ? 'Stark. Diese Aufgabe zaehlt jetzt als erledigt und bleibt fuer deinen Fortschritt abgeschlossen.'
              : completedForProgress
                ? 'Diese Wiederholung war noch nicht richtig, aber dein bereits erreichter Fortschritt bleibt erhalten.'
                : 'Noch nicht richtig. Du kannst die Aufgabe direkt in dieser Section erneut ueben.'}
          </Text>
        </View>
      ) : null}

      {exercise.lastResult !== 'unseen' || result !== 'unseen' ? (
        <Pressable
          onPress={restartExercise}
          style={({ pressed }) => [styles.repeatButton, pressed && styles.repeatButtonPressed]}>
          <Text style={styles.repeatButtonText}>Uebung wiederholen</Text>
        </Pressable>
      ) : null}

      {showSolution ? (
        <View style={styles.solution}>
          <Text style={styles.solutionTitle}>Loesungshinweis</Text>
          <Text style={styles.solutionText}>{exercise.explanationDe}</Text>
          <Text style={styles.solutionText}>{solutionSummary(exercise)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ExerciseSupportMaterial({ payload }: { payload: ExerciseSupportPayload }) {
  const hasSourceMaterial = Boolean(payload.sourceMaterial?.length);
  const hasWordBank = Boolean(payload.wordBank?.length);

  if (!hasSourceMaterial && !hasWordBank) {
    return null;
  }

  return (
    <View style={styles.supportFrame}>
      {payload.sourceMaterial?.map((material) => (
        <View key={material.title} style={styles.supportBlock}>
          <Text style={styles.supportTitle}>{material.title}</Text>
          {material.body ? <Text style={styles.supportBody}>{material.body}</Text> : null}
          {material.items?.length ? (
            <View style={styles.supportList}>
              {material.items.map((item) => (
                <Text key={item} style={styles.supportListItem}>
                  {item}
                </Text>
              ))}
            </View>
          ) : null}
          {material.noteDe ? <Text style={styles.supportNote}>{material.noteDe}</Text> : null}
        </View>
      ))}

      {payload.wordBank?.length ? (
        <View style={styles.wordBank}>
          <Text style={styles.wordBankTitle}>Wortbank</Text>
          <View style={styles.wordBankItems}>
            {payload.wordBank.map((word) => (
              <View key={word} style={styles.wordBankChip}>
                <Text style={styles.wordBankChipText}>{word}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function MultipleChoiceExercise({
  exercise,
  onSubmit,
  disabled,
}: {
  exercise: ExerciseSeed;
  onSubmit: (answer: unknown) => Promise<void>;
  disabled: boolean;
}) {
  const payload = exercise.payload as MultipleChoicePayload;
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(optionId: string) {
    if (payload.allowMultiple) {
      setSelected((current) =>
        current.includes(optionId)
          ? current.filter((value) => value !== optionId)
          : [...current, optionId]
      );
      return;
    }
    setSelected([optionId]);
  }

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{payload.prompt}</Text>
      <View style={styles.optionGroup}>
        {payload.options.map((option) => {
          const isActive = selected.includes(option.id);
          return (
            <Pressable
              key={option.id}
              onPress={() => toggle(option.id)}
              style={[styles.optionButton, isActive && styles.optionButtonActive]}>
              <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <SubmitButton
        label="Antwort pruefen"
        disabled={disabled || selected.length === 0}
        onPress={() => void onSubmit(selected)}
      />
    </View>
  );
}

function MatchingExercise({
  exercise,
  onSubmit,
  disabled,
}: {
  exercise: ExerciseSeed;
  onSubmit: (answer: unknown) => Promise<void>;
  disabled: boolean;
}) {
  const payload = exercise.payload as MatchingPayload;
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(payload.left[0]?.id ?? null);
  const [selectedMap, setSelectedMap] = useState<Record<string, string>>({});

  const assignedByRightId = useMemo(
    () => Object.fromEntries(Object.entries(selectedMap).map(([leftId, rightId]) => [rightId, leftId])),
    [selectedMap]
  );

  function assignRight(rightId: string) {
    if (!selectedLeftId) {
      return;
    }

    const nextMap = { ...selectedMap };
    const previousOwner = Object.entries(nextMap).find(([, mappedRightId]) => mappedRightId === rightId)?.[0];
    if (previousOwner && previousOwner !== selectedLeftId) {
      delete nextMap[previousOwner];
    }
    nextMap[selectedLeftId] = rightId;
    setSelectedMap(nextMap);
    setSelectedLeftId(null);
  }

  function clearAssignment(leftId: string) {
    const nextMap = { ...selectedMap };
    delete nextMap[leftId];
    setSelectedMap(nextMap);
    setSelectedLeftId(leftId);
  }

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{payload.prompt}</Text>

      <View style={styles.matchBoard}>
        <View style={styles.matchColumn}>
          <Text style={styles.matchColumnTitle}>Anwendungen</Text>
          {payload.left.map((leftItem) => {
            const rowIndex = payload.left.findIndex((item) => item.id === leftItem.id);
            const assignedRightId = selectedMap[leftItem.id];
            const isSelected = selectedLeftId === leftItem.id;
            const tone = toneForMatch(rowIndex);
            const shouldShowTone = isSelected || Boolean(assignedRightId);

            return (
              <Pressable
                key={leftItem.id}
                onPress={() => setSelectedLeftId(leftItem.id)}
                style={[
                  styles.matchTile,
                  shouldShowTone && {
                    backgroundColor: tone.background,
                    borderColor: tone.border,
                  },
                ]}>
                <Text style={styles.matchTileText}>{leftItem.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.matchColumn}>
          <Text style={styles.matchColumnTitle}>Beschreibungen</Text>
          <View style={styles.matchColumnList}>
            {payload.right.map((rightItem) => {
              const ownerLeftId = assignedByRightId[rightItem.id];
              const ownerIndex = ownerLeftId ? payload.left.findIndex((item) => item.id === ownerLeftId) : -1;
              const tone = ownerIndex >= 0 ? toneForMatch(ownerIndex) : null;
              const isInteractive = !ownerLeftId || ownerLeftId === selectedLeftId;

              return (
              <Pressable
                key={rightItem.id}
                disabled={!selectedLeftId || !isInteractive}
                onPress={() => {
                  if (ownerLeftId && ownerLeftId === selectedLeftId) {
                    clearAssignment(ownerLeftId);
                    return;
                  }
                  assignRight(rightItem.id);
                }}
                style={({ pressed }) => [
                  styles.matchTile,
                  styles.matchTileRight,
                  tone && {
                    backgroundColor: tone.background,
                    borderColor: tone.border,
                  },
                  pressed && selectedLeftId && isInteractive && styles.matchTilePressed,
                ]}>
                <Text style={[styles.matchTileText, tone && { color: palette.ink }]}>{rightItem.label}</Text>
              </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <SubmitButton
        label="Zuordnung pruefen"
        disabled={disabled || Object.keys(selectedMap).length !== payload.left.length}
        onPress={() => void onSubmit(selectedMap)}
      />
    </View>
  );
}

function ClozeExercise({
  exercise,
  onSubmit,
  disabled,
}: {
  exercise: ExerciseSeed;
  onSubmit: (answer: unknown) => Promise<void>;
  disabled: boolean;
}) {
  const payload = exercise.payload as ClozePayload;
  return (
    <InlineClozeExercise
      payload={payload}
      disabled={disabled}
      onSubmit={onSubmit}
      submitLabel="Luecken pruefen"
    />
  );
}

function ListeningClozeExercise({
  exercise,
  onSubmit,
  disabled,
}: {
  exercise: ExerciseSeed;
  onSubmit: (answer: unknown) => Promise<void>;
  disabled: boolean;
}) {
  const payload = exercise.payload as ListeningClozePayload;
  return (
    <InlineClozeExercise
      payload={payload}
      disabled={disabled}
      onSubmit={onSubmit}
      submitLabel="Listening pruefen"
      trackId={payload.trackId}
    />
  );
}

function InlineClozeExercise({
  payload,
  disabled,
  onSubmit,
  submitLabel,
  trackId,
}: {
  payload: ClozePayload;
  disabled: boolean;
  onSubmit: (answer: unknown) => Promise<void>;
  submitLabel: string;
  trackId?: string;
}) {
  const [answers, setAnswers] = useState<ClozeAnswerMap>({});
  const segments = useMemo(() => buildInlineClozeSegments(payload), [payload]);
  const isComplete = payload.blanks.every((blank) => (answers[blank.id] ?? '').trim().length > 0);

  function updateAnswer(blankId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [blankId]: value,
    }));
  }

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{payload.prompt}</Text>
      {trackId ? <Text style={styles.listeningHint}>Zu {formatTrackLabel(trackId)}</Text> : null}

      <View style={styles.inlineClozeFrame}>
        <View style={styles.inlineClozeWrap}>
          {segments.map((segment, index) => {
            if (segment.type === 'text') {
              return (
                <Text key={`text-${index}`} style={styles.inlineClozeText}>
                  {segment.value}
                </Text>
              );
            }

            const width = Math.max(72, Math.min(220, segment.blank.answer.length * 12 + 34));
            return (
              <View key={segment.blank.id} style={[styles.inlineBlankShell, { width }]}>
                <TextInput
                  value={answers[segment.blank.id] ?? ''}
                  onChangeText={(value) => updateAnswer(segment.blank.id, value)}
                  placeholder={segment.blank.placeholder ?? `${segment.index + 1}`}
                  placeholderTextColor="#97A3B4"
                  style={styles.inlineBlankInput}
                  autoCapitalize="none"
                />
              </View>
            );
          })}
        </View>
      </View>

      <SubmitButton label={submitLabel} disabled={disabled || !isComplete} onPress={() => void onSubmit(answers)} />
    </View>
  );
}

function OrderingExercise({
  exercise,
  onSubmit,
  disabled,
}: {
  exercise: ExerciseSeed;
  onSubmit: (answer: unknown) => Promise<void>;
  disabled: boolean;
}) {
  const payload = exercise.payload as OrderingPayload;
  const [order, setOrder] = useState(payload.items.map((item) => item.id));

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) {
      return;
    }
    const copy = [...order];
    const [current] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, current);
    setOrder(copy);
  }

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{payload.prompt}</Text>
      {order.map((itemId, index) => {
        const item = payload.items.find((entry) => entry.id === itemId);
        if (!item) {
          return null;
        }
        return (
          <View key={item.id} style={styles.orderRow}>
            <Text style={styles.orderIndex}>{index + 1}</Text>
            <Text style={styles.orderLabel}>{item.label}</Text>
            <View style={styles.orderActions}>
              <MiniButton label="Hoch" onPress={() => move(index, -1)} />
              <MiniButton label="Runter" onPress={() => move(index, 1)} />
            </View>
          </View>
        );
      })}
      <SubmitButton label="Reihenfolge pruefen" disabled={disabled} onPress={() => void onSubmit(order)} />
    </View>
  );
}

function ShortAnswerExercise({
  exercise,
  onSubmit,
  disabled,
}: {
  exercise: ExerciseSeed;
  onSubmit: (answer: unknown) => Promise<void>;
  disabled: boolean;
}) {
  const payload = exercise.payload as ShortAnswerPayload;
  const [answer, setAnswer] = useState('');

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{payload.prompt}</Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder={payload.placeholder ?? 'Antwort eingeben'}
        placeholderTextColor="#8C98A8"
        style={[styles.input, styles.longInput]}
        multiline
      />
      <SubmitButton
        label="Antwort pruefen"
        disabled={disabled || answer.trim().length === 0}
        onPress={() => void onSubmit(answer)}
      />
    </View>
  );
}

function SubmitButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.submitButton, disabled && styles.submitButtonDisabled]}>
      <Text style={styles.submitButtonText}>{label}</Text>
    </Pressable>
  );
}

function MiniButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.miniButton}>
      <Text style={styles.miniButtonText}>{label}</Text>
    </Pressable>
  );
}

function solutionSummary(exercise: ExerciseSeed) {
  switch (exercise.type) {
    case 'multiple_choice': {
      const payload = exercise.payload as MultipleChoicePayload;
      return `Richtige Auswahl: ${payload.options
        .filter((option) => payload.correctOptionIds.includes(option.id))
        .map((option) => option.label)
        .join(' | ')}`;
    }
    case 'matching': {
      const payload = exercise.payload as MatchingPayload;
      return `Richtige Paare: ${payload.pairs
        .map((pair) => {
          const left = payload.left.find((entry) => entry.id === pair.leftId)?.label ?? pair.leftId;
          const right = payload.right.find((entry) => entry.id === pair.rightId)?.label ?? pair.rightId;
          return `${left} -> ${right}`;
        })
        .join(' | ')}`;
    }
    case 'cloze':
    case 'listening_cloze': {
      const payload = exercise.payload as ClozePayload;
      return `Loesungen: ${payload.blanks.map((blank) => blank.answer).join(', ')}`;
    }
    case 'ordering': {
      const payload = exercise.payload as OrderingPayload;
      return `Soll-Reihenfolge: ${payload.correctOrder
        .map((id) => payload.items.find((item) => item.id === id)?.label ?? id)
        .join(' -> ')}`;
    }
    case 'short_answer': {
      const payload = exercise.payload as ShortAnswerPayload;
      return `Akzeptierte Kernantworten: ${payload.acceptedAnswers.join(' | ')}`;
    }
    default:
      return '';
  }
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
  cardEmbedded: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    elevation: 0,
    padding: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  typeLabel: {
    color: palette.signal,
    textTransform: 'uppercase',
    fontSize: typography.small,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '800',
  },
  instructions: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  supportFrame: {
    backgroundColor: '#DCE8F5',
    borderColor: '#8DB5E0',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  supportBlock: {
    gap: spacing.xs,
  },
  supportTitle: {
    color: palette.navy,
    fontSize: typography.body,
    fontWeight: '800',
  },
  supportBody: {
    color: palette.ink,
    fontSize: typography.body,
    lineHeight: 24,
  },
  supportList: {
    gap: spacing.xs,
  },
  supportListItem: {
    color: palette.ink,
    fontSize: typography.body,
    lineHeight: 22,
  },
  supportNote: {
    color: palette.slate,
    fontSize: typography.small,
    lineHeight: 18,
  },
  wordBank: {
    gap: spacing.xs,
  },
  wordBankTitle: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  wordBankItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  wordBankChip: {
    backgroundColor: '#F7C9AE',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  wordBankChipText: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '800',
  },
  exerciseBlock: {
    gap: spacing.sm,
  },
  prompt: {
    color: palette.ink,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  optionButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.mist,
    padding: spacing.md,
    backgroundColor: '#EEF4FB',
  },
  optionButtonActive: {
    borderColor: palette.navy,
    backgroundColor: '#C9DDF4',
  },
  optionLabel: {
    color: palette.ink,
    fontSize: typography.body,
  },
  optionLabelActive: {
    color: palette.navy,
    fontWeight: '700',
  },
  matchBoard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  matchColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  matchColumnTitle: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  matchColumnList: {
    gap: spacing.sm,
  },
  matchTile: {
    height: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.mist,
    backgroundColor: '#FFF2E3',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  matchTileRight: {
    backgroundColor: '#FFF2E3',
  },
  matchTilePressed: {
    opacity: 0.84,
  },
  matchTileText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  inlineClozeFrame: {
    backgroundColor: '#FFF2E3',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.mist,
    padding: spacing.md,
  },
  inlineClozeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inlineClozeText: {
    color: palette.ink,
    fontSize: typography.body,
    lineHeight: 28,
  },
  inlineBlankShell: {
    minHeight: 34,
    justifyContent: 'flex-end',
  },
  inlineBlankInput: {
    minHeight: 34,
    borderBottomWidth: 2,
    borderBottomColor: '#C5D1DE',
    backgroundColor: 'transparent',
    color: palette.ink,
    paddingHorizontal: spacing.xs,
    paddingVertical: 0,
    fontSize: typography.body,
    textAlign: 'center',
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.mist,
    backgroundColor: '#F4E9DA',
    color: palette.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
  },
  longInput: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  listeningHint: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#DCE8F5',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  orderIndex: {
    width: 24,
    color: palette.navy,
    fontWeight: '800',
  },
  orderLabel: {
    flex: 1,
    color: palette.ink,
    fontSize: typography.body,
  },
  orderActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  miniButton: {
    borderRadius: radius.pill,
    backgroundColor: '#C9DDF4',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  miniButtonText: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: palette.navy,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: palette.cloud,
    fontSize: typography.body,
    fontWeight: '700',
  },
  feedback: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  feedbackCorrect: {
    backgroundColor: '#C7E6DA',
  },
  feedbackIncorrect: {
    backgroundColor: '#F3C7AE',
  },
  feedbackTitle: {
    color: palette.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  feedbackText: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  repeatButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#C9DDF4',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  repeatButtonPressed: {
    opacity: 0.82,
  },
  repeatButtonText: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '700',
  },
  solution: {
    backgroundColor: '#DCE8F5',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  solutionTitle: {
    color: palette.navy,
    fontSize: typography.body,
    fontWeight: '800',
  },
  solutionText: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
