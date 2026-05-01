import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
import { SetupRequired } from '@/components/setup-required';
import { UnitQuizCard } from '@/components/unit-quiz-card';
import { VocabFlashcard } from '@/components/vocab-flashcard';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { useLearningApp } from '@/providers/learning-app-provider';
import type { UnitVocabularySnapshot, VocabStatus } from '@/types/content';

function clampIndex(index: number, total: number) {
  if (total === 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), total - 1);
}

export default function VocabularyScreen() {
  const app = useLearningApp();
  const {
    getCachedUnitVocabularySnapshot,
    getUnitVocabularySnapshot,
    hasPrivateContent,
    isReady,
    unitOverviews,
    setUnitQuizStatus,
    updateVocabStatus,
  } = app;
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(unitOverviews[0]?.unit.id ?? null);
  const unitId = selectedUnitId ?? unitOverviews[0]?.unit.id ?? null;
  const [snapshot, setSnapshot] = useState<UnitVocabularySnapshot | null>(
    unitId ? getCachedUnitVocabularySnapshot(unitId) : null
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedUnitId && unitOverviews[0]?.unit.id) {
      setSelectedUnitId(unitOverviews[0].unit.id);
    }
  }, [selectedUnitId, unitOverviews]);

  useEffect(() => {
    let isCancelled = false;

    async function loadSnapshot() {
      if (!unitId) {
        setSnapshot(null);
        return;
      }

      const cached = getCachedUnitVocabularySnapshot(unitId);
      if (cached && !isCancelled) {
        setSnapshot(cached);
        setCurrentIndex((current) => clampIndex(current, cached.items.length));
      }

      const nextSnapshot = await getUnitVocabularySnapshot(unitId);
      if (!isCancelled && nextSnapshot) {
        setSnapshot(nextSnapshot);
        setCurrentIndex((current) => clampIndex(current, nextSnapshot.items.length));
      }
    }

    void loadSnapshot();
    return () => {
      isCancelled = true;
    };
  }, [getCachedUnitVocabularySnapshot, getUnitVocabularySnapshot, unitId]);

  const currentItem = useMemo(
    () => (snapshot ? snapshot.items[clampIndex(currentIndex, snapshot.items.length)] ?? null : null),
    [currentIndex, snapshot]
  );

  async function reloadSnapshot(nextIndex?: number) {
    if (!unitId) {
      return;
    }
    const nextSnapshot = await getUnitVocabularySnapshot(unitId);
    if (!nextSnapshot) {
      return;
    }
    setSnapshot(nextSnapshot);
    setCurrentIndex((current) => clampIndex(nextIndex ?? current, nextSnapshot.items.length));
  }

  async function handleStatusChange(status: VocabStatus) {
    if (!currentItem) {
      return;
    }

    setIsSaving(true);
    try {
      await updateVocabStatus(currentItem.id, status);
      const nextIndex =
        snapshot && snapshot.items.length > 0 ? Math.min(currentIndex + 1, snapshot.items.length - 1) : currentIndex;
      await reloadSnapshot(nextIndex);
      setIsFlipped(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSkipQuiz() {
    if (!unitId) {
      return;
    }
    await setUnitQuizStatus(unitId, 'skipped');
    await reloadSnapshot();
  }

  if (!isReady) {
    return <LoadingState />;
  }

  if (unitOverviews.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SetupRequired hasPrivateContent={hasPrivateContent} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!snapshot) {
    return <LoadingState label="Lade Vokabeln..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.title}>Vokabeln</Text>
          <Text style={styles.progressText}>
            {snapshot.learnedCount}/{snapshot.totalCount} Vokabeln als gemerkt markiert
          </Text>
        </View>

        <View style={styles.unitSelector}>
          {unitOverviews.map((unitOverview) => {
            const isSelected = unitOverview.unit.id === snapshot.unit.id;
            return (
              <Pressable
                key={unitOverview.unit.id}
                onPress={() => {
                  setSelectedUnitId(unitOverview.unit.id);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                style={({ pressed }) => [
                  styles.unitChip,
                  isSelected && styles.unitChipActive,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.unitChipText, isSelected && styles.unitChipTextActive]}>
                  {unitOverview.unit.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {currentItem ? (
          <VocabFlashcard
            item={currentItem}
            isFlipped={isFlipped}
            index={clampIndex(currentIndex, snapshot.items.length)}
            total={snapshot.items.length}
            onFlip={() => setIsFlipped((current) => !current)}
            onStatusChange={(status) => void handleStatusChange(status)}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Keine Vokabeln gefunden</Text>
            <Text style={styles.emptyText}>
              Sobald der lokale Unit-Seed Vokabeln enthaelt, erscheinen sie hier als Lernkarten.
            </Text>
          </View>
        )}

        <View style={styles.deckControls}>
          <DeckButton
            label="Vorherige"
            disabled={currentIndex === 0 || snapshot.items.length === 0}
            onPress={() => {
              setCurrentIndex((current) => clampIndex(current - 1, snapshot.items.length));
              setIsFlipped(false);
            }}
          />
          <Text style={styles.deckStatus}>{isSaving ? 'Speichert...' : 'Deck-Navigation'}</Text>
          <DeckButton
            label="Naechste"
            disabled={currentIndex >= snapshot.items.length - 1 || snapshot.items.length === 0}
            onPress={() => {
              setCurrentIndex((current) => clampIndex(current + 1, snapshot.items.length));
              setIsFlipped(false);
            }}
          />
        </View>

        <UnitQuizCard
          snapshot={snapshot}
          onStart={() =>
            router.push({
              pathname: '/quiz/[unitId]',
              params: { unitId: snapshot.unit.id },
            })
          }
          onSkip={() => void handleSkipQuiz()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DeckButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.deckButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
      <Text style={styles.deckButtonText}>{label}</Text>
    </Pressable>
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
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.mist,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '800',
  },
  progressText: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '700',
  },
  deckControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  unitChip: {
    backgroundColor: '#E6EDF8',
    borderColor: palette.mist,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  unitChipActive: {
    backgroundColor: palette.navy,
    borderColor: palette.navy,
  },
  unitChipText: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '800',
  },
  unitChipTextActive: {
    color: palette.cloud,
  },
  deckStatus: {
    flex: 1,
    color: palette.slate,
    fontSize: typography.small,
    textAlign: 'center',
    fontWeight: '700',
  },
  deckButton: {
    minWidth: 110,
    backgroundColor: '#E6EDF8',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deckButtonText: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
  emptyCard: {
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.mist,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '800',
  },
  emptyText: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
