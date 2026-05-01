import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioTrackCard } from '@/components/audio-track-card';
import { ExerciseRenderer } from '@/components/exercise-renderer';
import { VocabCard } from '@/components/vocab-card';
import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import type { ListeningClozePayload, SectionDetail } from '@/types/content';

export type SectionContentFocus = 'grammar' | 'vocab' | 'listening' | 'exercises';

const focusLabels: Record<SectionContentFocus, string> = {
  grammar: 'Grammatik',
  vocab: 'Vokabeln',
  listening: 'Listening',
  exercises: 'Zuordnung',
};

export function isSectionContentFocus(value: unknown): value is SectionContentFocus {
  return value === 'grammar' || value === 'vocab' || value === 'listening' || value === 'exercises';
}

export function SectionDetailView({
  detail,
  header,
  initialFocus,
  onTrackComplete,
  onExerciseSubmit,
}: {
  detail: SectionDetail;
  header?: ReactNode;
  initialFocus?: SectionContentFocus | null;
  onTrackComplete: (trackId: string) => Promise<void>;
  onExerciseSubmit: (
    exercise: SectionDetail['exercises'][number],
    answer: unknown
  ) => Promise<'correct' | 'incorrect'>;
}) {
  const listeningExercises = detail.exercises.filter((exercise) => Boolean(getExerciseTrackId(exercise)));
  const matchingExercises = detail.exercises.filter(
    (exercise) => !getExerciseTrackId(exercise) && exercise.type === 'matching'
  );
  const grammarExercises = detail.exercises.filter(
    (exercise) => !getExerciseTrackId(exercise) && exercise.type !== 'matching'
  );

  const grammarBlock = (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>Grammatik</Text>
      {detail.section.grammarTopics.map((topic) => (
        <View key={topic.id} style={styles.topicCard}>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.topicText}>{topic.explanationDe}</Text>
          {topic.examples.map((example) => (
            <Text key={example} style={styles.topicExample}>
              {example}
            </Text>
          ))}
          {topic.quickTips.map((tip) => (
            <Text key={tip} style={styles.topicTip}>
              {tip}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  const vocabBlock = (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>Vokabeln</Text>
      <View style={styles.vocabGrid}>
        {detail.vocabItems.map((item) => (
          <View key={item.id} style={styles.vocabGridItem}>
            <VocabCard item={item} showActions={false} />
          </View>
        ))}
      </View>
    </View>
  );

  const grammarExerciseBlock =
    grammarExercises.length > 0 ? (
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Grammatik-Uebungen</Text>
        {grammarExercises.map((exercise) => (
          <ExerciseRenderer
            key={exercise.id}
            exercise={exercise}
            onSubmit={(answer) => onExerciseSubmit(exercise, answer)}
          />
        ))}
      </View>
    ) : null;

  const listeningExercisesByTrackId = listeningExercises.reduce((map, exercise) => {
    const trackId = getExerciseTrackId(exercise);
    if (!trackId) {
      return map;
    }

    const current = map.get(trackId) ?? [];
    current.push(exercise);
    map.set(trackId, current);
    return map;
  }, new Map<string, typeof listeningExercises>());
  const pairedListeningExerciseIds = new Set<string>();

  const listeningBlock = detail.listeningTracks.length > 0 || listeningExercises.length > 0 ? (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>Listening</Text>
      {detail.listeningTracks.map((track) => {
        const pairedExercises = listeningExercisesByTrackId.get(track.id) ?? [];
        pairedExercises.forEach((exercise) => pairedListeningExerciseIds.add(exercise.id));

        return (
          <AudioTrackCard key={track.id} track={track} onComplete={() => onTrackComplete(track.id)}>
            {pairedExercises.map((exercise) => (
              <ExerciseRenderer
                key={exercise.id}
                exercise={exercise}
                onSubmit={(answer) => onExerciseSubmit(exercise, answer)}
                variant="embedded"
              />
            ))}
          </AudioTrackCard>
        );
      })}
      {listeningExercises
        .filter((exercise) => !pairedListeningExerciseIds.has(exercise.id))
        .map((exercise) => (
          <View key={exercise.id} style={styles.listeningExerciseOnlyCard}>
            <ExerciseRenderer
              exercise={exercise}
              onSubmit={(answer) => onExerciseSubmit(exercise, answer)}
            />
          </View>
        ))}
    </View>
  ) : null;

  const matchingBlock = matchingExercises.length > 0 ? (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>Zuordnung</Text>
      {matchingExercises.map((exercise) => (
        <ExerciseRenderer
          key={exercise.id}
          exercise={exercise}
          onSubmit={(answer) => onExerciseSubmit(exercise, answer)}
        />
      ))}
    </View>
  ) : null;

  const focusedBlocks: Record<SectionContentFocus, ReactNode> = {
    grammar: (
      <>
        {grammarBlock}
        {grammarExerciseBlock}
      </>
    ),
    vocab: vocabBlock,
    listening: listeningBlock,
    exercises: matchingBlock,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {header}

        <View style={styles.hero}>
          <Text style={styles.ref}>{detail.section.bookSectionRef}</Text>
          <Text style={styles.title}>{detail.section.title}</Text>
          <Text style={styles.subtitle}>{detail.section.subtitle}</Text>
          <Text style={styles.summary}>{detail.section.summaryDe}</Text>
        </View>

        {initialFocus ? (
          <View style={styles.focusCard}>
            <Text style={styles.focusEyebrow}>Ausgewaehlter Lernbereich</Text>
            <Text style={styles.focusTitle}>{focusLabels[initialFocus]}</Text>
          </View>
        ) : null}

        {initialFocus ? (
          focusedBlocks[initialFocus]
        ) : (
          <>
            {grammarBlock}
            {vocabBlock}
            {grammarExerciseBlock}
            {listeningBlock}
            {matchingBlock}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getExerciseTrackId(exercise: SectionDetail['exercises'][number]) {
  if (exercise.type === 'listening_cloze') {
    return (exercise.payload as ListeningClozePayload).trackId;
  }

  const text = `${exercise.title} ${exercise.bookSectionRef}`;
  const match = text.match(/\btrack\s*(\d+)[.-](\d+)\b/i);
  return match ? `track-${match[1]}-${match[2]}` : null;
}

export function MissingSectionState({ header }: { header?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {header}
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>Abschnitt nicht gefunden</Text>
          <Text style={styles.missingText}>
            Pruefe den lokalen Seed oder oeffne die App nach dem Content-Build neu.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  hero: {
    backgroundColor: palette.navy,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  ref: {
    color: '#D6E2F0',
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    color: palette.cloud,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#C3D5E7',
    fontSize: typography.cardTitle,
    fontWeight: '600',
  },
  summary: {
    color: '#E8F0F8',
    fontSize: typography.body,
    lineHeight: 24,
  },
  focusCard: {
    backgroundColor: '#D7ECFF',
    borderColor: '#5C9ED6',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.xs,
    padding: spacing.lg,
    ...shadows.card,
  },
  focusEyebrow: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  focusTitle: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '900',
  },
  block: {
    gap: spacing.md,
  },
  vocabGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  vocabGridItem: {
    width: '48%',
  },
  blockTitle: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '800',
  },
  topicCard: {
    backgroundColor: '#F9D8BE',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#E39B67',
    ...shadows.card,
  },
  topicTitle: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '800',
  },
  topicText: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  topicExample: {
    color: palette.navy,
    fontSize: typography.body,
    fontStyle: 'italic',
  },
  topicTip: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
  },
  listeningExerciseOnlyCard: {
    gap: spacing.md,
  },
  missingState: {
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.mist,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  missingTitle: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '800',
  },
  missingText: {
    color: palette.slate,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
