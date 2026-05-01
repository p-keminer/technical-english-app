import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/constants/theme';

export function SetupRequired({ hasPrivateContent }: { hasPrivateContent: boolean }) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Lokaler Setup-Schritt</Text>
      <Text style={styles.title}>
        {hasPrivateContent ? 'Private Inhalte erkannt, Seed fehlt noch.' : 'Noch keine privaten Buchdaten importiert.'}
      </Text>
      <Text style={styles.body}>
        Diese App bleibt absichtlich repo-sicher. PDF, Answer Key, Audios und daraus generierte Inhalte
        liegen nur lokal unter <Text style={styles.code}>private-content/</Text>.
      </Text>
      <Text style={styles.body}>
        1. <Text style={styles.code}>npm run content:extract</Text>
      </Text>
      <Text style={styles.body}>
        2. <Text style={styles.code}>npm run content:build</Text>
      </Text>
      <Text style={styles.body}>
        3. App neu starten, damit Metro den lokalen Private-Content-Alias aufloest.
      </Text>
    </View>
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
  },
  eyebrow: {
    color: palette.signal,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: typography.small,
    fontWeight: '700',
  },
  title: {
    color: palette.ink,
    fontSize: typography.section,
    fontWeight: '700',
  },
  body: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 22,
  },
  code: {
    color: palette.navy,
    fontFamily: 'monospace',
  },
});
