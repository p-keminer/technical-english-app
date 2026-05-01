import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
import { SetupRequired } from '@/components/setup-required';
import { VocabCard } from '@/components/vocab-card';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { useLearningApp } from '@/providers/learning-app-provider';

export default function ReviewScreen() {
  const { hasPrivateContent, isReady, overview, review, updateVocabStatus } = useLearningApp();

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
        <Text style={styles.title}>Review-Queue</Text>
        <Text style={styles.subtitle}>
          Falsche Übungen bleiben hier sichtbar. Vokabeln kannst du direkt neu bewerten.
        </Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Übungen zum Wiederholen</Text>
          {review.exercises.length === 0 ? (
            <Text style={styles.empty}>Aktuell ist keine Übung offen. Sehr gut.</Text>
          ) : (
            review.exercises.map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                <Text style={styles.reviewSection}>{item.sectionTitle}</Text>
                <Text style={styles.reviewTitle}>{item.title}</Text>
                <Text style={styles.reviewText}>{item.explanationDe}</Text>
                <Text
                  style={styles.link}
                  onPress={() =>
                    router.push({
                      pathname: '/section/[sectionId]',
                      params: { sectionId: item.sectionId },
                    })
                  }>
                  Zur Sektion springen
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Vokabeln im Umlauf</Text>
          {review.vocabItems.length === 0 ? (
            <Text style={styles.empty}>Alle Vokabeln sind aktuell als gelernt markiert.</Text>
          ) : (
            review.vocabItems.map((item) => (
              <VocabCard
                key={item.id}
                item={{
                  id: item.id,
                  sectionId: '',
                  term: item.term,
                  translationDe: item.translationDe,
                  explanationDe: 'Nutze diese Review-Ansicht für schnelles Wiederholen.',
                  exampleEn: item.exampleEn,
                  exampleDe: 'Passe den Status an, damit deine Queue sinnvoll bleibt.',
                  status: item.status,
                }}
                onStatusChange={(status) => void updateVocabStatus(item.id, status)}
              />
            ))
          )}
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
  subtitle: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: palette.cloud,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.mist,
  },
  panelTitle: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '800',
  },
  reviewCard: {
    backgroundColor: '#F7F9FB',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  reviewSection: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
  },
  reviewTitle: {
    color: palette.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  reviewText: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  link: {
    color: palette.navy,
    fontSize: typography.body,
    fontWeight: '700',
  },
  empty: {
    color: palette.slate,
    fontSize: typography.body,
  },
});
