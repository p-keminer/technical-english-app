import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
import { SetupRequired } from '@/components/setup-required';
import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useLearningApp } from '@/providers/learning-app-provider';

export default function SettingsScreen() {
  const { hasPrivateContent, isReady, overview, resetProgress } = useLearningApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  async function handleReset() {
    if (isResetting) {
      return;
    }

    if (!confirmReset) {
      setConfirmReset(true);
      setFeedback('Noch einmal tippen, um den Lernfortschritt wirklich zurueckzusetzen.');
      return;
    }

    setIsResetting(true);
    try {
      await resetProgress();
      setFeedback('Lernfortschritt wurde zurueckgesetzt.');
      setConfirmReset(false);
    } finally {
      setIsResetting(false);
    }
  }

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
        <Text style={styles.title}>Lernfortschritt</Text>

        <View style={styles.card}>
          <Pressable onPress={() => void handleReset()} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
            <Text style={styles.resetButtonText}>
              {isResetting ? 'Setze zurueck...' : confirmReset ? 'Jetzt wirklich zuruecksetzen' : 'Lernfortschritt zuruecksetzen'}
            </Text>
          </Pressable>
          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
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
  title: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '800',
  },
  card: {
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.mist,
    ...shadows.card,
  },
  resetButton: {
    backgroundColor: '#F3C7AE',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetButtonText: {
    color: palette.signal,
    fontSize: typography.body,
    fontWeight: '800',
  },
  feedback: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
