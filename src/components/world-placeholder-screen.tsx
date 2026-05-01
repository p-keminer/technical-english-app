import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WorldPlayfield } from '@/components/world-playfield';
import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useWorld } from '@/world/world-context';

export function WorldPlaceholderScreen() {
  const { currentWorld } = useWorld();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.heroCube} />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Engineering Quest</Text>
            <Text style={styles.title}>{currentWorld.title}</Text>
            <Text style={styles.subtitle}>{getWorldIntro(currentWorld.id)}</Text>
          </View>
        </View>

        <WorldPlayfield />
      </ScrollView>
    </SafeAreaView>
  );
}

function getWorldIntro(worldId: string) {
  if (worldId === 'hub') {
    return 'Blockige Startwelt: laufe zum Vokabelheft, zur Unit-Station, zum Terminal oder zur Werkzeugkiste.';
  }

  if (worldId === 'unit-1') {
    return 'Unit-1-Welt: Abschnittswelten, Quiz-Gate und Rueckweg zum Hub liegen als begehbare Objekte bereit.';
  }

  return 'Abschnittswelt: GRAM, VOC, AUD und EX oeffnen jeweils nur ihren eigenen Lernbereich.';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7ECDF1',
  },
  scrollContent: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 128,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    borderColor: '#0A2342',
    borderRadius: radius.lg,
    borderWidth: 3,
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
    ...shadows.card,
  },
  heroCube: {
    backgroundColor: '#FFD232',
    borderBottomColor: '#A86B0C',
    borderBottomWidth: 8,
    borderColor: '#0A2342',
    borderRadius: 14,
    borderWidth: 3,
    height: 58,
    transform: [{ rotate: '-5deg' }],
    width: 58,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: palette.signal,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.slate,
    fontSize: typography.small,
    lineHeight: 19,
  },
});
