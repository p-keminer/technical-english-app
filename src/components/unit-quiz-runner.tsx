import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, radius, spacing, typography } from '@/constants/theme';
import type { UnitVocabularySnapshot } from '@/types/content';

import { ScreenBackHeader } from './screen-back-header';

type QuizQuestion = {
  vocabId: string;
  prompt: string;
  sectionRef: string;
  correctAnswer: string;
  options: string[];
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function buildQuestions(snapshot: UnitVocabularySnapshot): QuizQuestion[] {
  return snapshot.items.map((item) => {
    const distractors = shuffle(
      snapshot.items
        .filter((candidate) => candidate.id !== item.id)
        .map((candidate) => candidate.translationDe)
    ).slice(0, 3);

    return {
      vocabId: item.id,
      prompt: item.term,
      sectionRef: item.sectionRef,
      correctAnswer: item.translationDe,
      options: shuffle([item.translationDe, ...distractors]),
    };
  });
}

export function UnitQuizRunner({
  snapshot,
  onBack,
  onPassed,
  onSkipped,
}: {
  snapshot: UnitVocabularySnapshot;
  onBack: () => void;
  onPassed: () => Promise<void>;
  onSkipped: () => Promise<void>;
}) {
  const questions = useMemo(() => buildQuestions(snapshot), [snapshot]);
  const [queue, setQueue] = useState<string[]>([]);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmSkip, setConfirmSkip] = useState(false);

  useEffect(() => {
    setQueue(questions.map((question) => question.vocabId));
    setSolvedIds([]);
    setFeedback(null);
    setConfirmSkip(false);
  }, [questions]);

  const currentQuestion = questions.find((question) => question.vocabId === queue[0]) ?? null;
  const solvedCount = solvedIds.length;

  async function handleAnswer(option: string) {
    if (!currentQuestion) {
      return;
    }

    if (option === currentQuestion.correctAnswer) {
      const nextQueue = queue.slice(1);
      const nextSolved = [...solvedIds, currentQuestion.vocabId];
      setSolvedIds(nextSolved);
      setQueue(nextQueue);
      setConfirmSkip(false);
      setFeedback('Richtig. Diese Vokabel gilt im Abschlussquiz jetzt als abgehakt.');

      if (nextQueue.length === 0) {
        await onPassed();
      }
      return;
    }

    setQueue([...queue.slice(1), currentQuestion.vocabId]);
    setConfirmSkip(false);
    setFeedback('Noch nicht richtig. Die Frage kommt spaeter im selben Abschlussquiz erneut.');
  }

  async function handleSkip() {
    if (!confirmSkip) {
      setConfirmSkip(true);
      setFeedback('Tippe noch einmal auf "Jetzt ueberspringen", wenn du die Unit bewusst freigeben willst.');
      return;
    }

    await onSkipped();
  }

  if (snapshot.quiz.status === 'locked') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScreenBackHeader label="Zurueck zur Unit" eyebrow="Abschlussquiz" onPress={onBack} />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Quiz noch gesperrt</Text>
            <Text style={styles.summaryText}>
              Erledige zuerst alle Uebungen der Unit. Danach kannst du alle behandelten Vokabeln in einem Durchlauf abpruefen.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (snapshot.quiz.status === 'passed' || snapshot.quiz.status === 'skipped') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScreenBackHeader label="Zurueck zur Unit" eyebrow="Abschlussquiz" onPress={onBack} />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {snapshot.quiz.status === 'passed' ? 'Quiz bereits bestanden' : 'Quiz wurde uebersprungen'}
            </Text>
            <Text style={styles.summaryText}>
              {snapshot.quiz.status === 'passed'
                ? 'Du hast die Unit bereits ueber das Vokabelquiz freigeschaltet.'
                : 'Die Unit wurde durch bewusstes Ueberspringen freigegeben.'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenBackHeader label="Zurueck zur Unit" eyebrow="Abschlussquiz" onPress={onBack} />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{snapshot.unit.title}</Text>
          <Text style={styles.summaryText}>
            Antworte alle Vokabelkarten korrekt. Falsche Antworten kommen spaeter wieder, bis alles sitzt.
          </Text>
          <Text style={styles.progressText}>
            {solvedCount}/{questions.length} Vokabeln vollstaendig geloest
          </Text>
          <Pressable onPress={() => void handleSkip()} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
            <Text style={styles.skipButtonText}>
              {confirmSkip ? 'Jetzt ueberspringen' : 'Explizit ueberspringen'}
            </Text>
          </Pressable>
        </View>

        {currentQuestion ? (
          <View style={styles.questionCard}>
            <Text style={styles.sectionRef}>{currentQuestion.sectionRef}</Text>
            <Text style={styles.questionPrompt}>{currentQuestion.prompt}</Text>
            <Text style={styles.questionHint}>Welche deutsche Bedeutung passt am besten?</Text>

            <View style={styles.options}>
              {currentQuestion.options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => void handleAnswer(option)}
                  style={({ pressed }) => [styles.optionButton, pressed && styles.pressed]}>
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              ))}
            </View>

            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
          </View>
        ) : null}
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
  summaryCard: {
    backgroundColor: '#FFF9F1',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#F1D8C7',
  },
  summaryTitle: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '800',
  },
  summaryText: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  progressText: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '700',
  },
  skipButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBE9DE',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  skipButtonText: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
  },
  questionCard: {
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.mist,
  },
  sectionRef: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  questionPrompt: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '800',
  },
  questionHint: {
    color: palette.slate,
    fontSize: typography.body,
  },
  options: {
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: '#EEF3F8',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  optionText: {
    color: palette.navy,
    fontSize: typography.body,
    fontWeight: '700',
  },
  feedback: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.82,
  },
});
