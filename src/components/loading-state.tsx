import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/constants/theme';

export function LoadingState({ label = 'Lade Lernstand...' }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={palette.navy} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    color: palette.slate,
    fontSize: typography.body,
  },
});
