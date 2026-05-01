import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { type ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { getAudioModule } from '@/lib/private-content';
import type { ListeningTrackSeed } from '@/types/content';

export function AudioTrackCard({
  children,
  track,
  onComplete,
}: {
  children?: ReactNode;
  track: ListeningTrackSeed & { completed: boolean };
  onComplete: () => Promise<void>;
}) {
  const source = getAudioModule(track.assetKey);
  const player = useAudioPlayer(source ?? null, { updateInterval: 250, keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (status.didJustFinish && !track.completed) {
      void onComplete();
    }
  }, [onComplete, status.didJustFinish, track.completed]);

  const isPlayable = Boolean(source);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{track.title}</Text>
          <Text style={styles.prompt}>{track.promptDe}</Text>
        </View>
        <View style={[styles.statusBadge, track.completed && styles.statusBadgeDone]}>
          <Text style={[styles.statusText, track.completed && styles.statusTextDone]}>
            {track.completed ? 'Gehört' : 'Offen'}
          </Text>
        </View>
      </View>

      <Text style={styles.sourceRef}>{track.sourceRef}</Text>

      <View style={styles.actions}>
        <ActionButton
          label={status.playing ? 'Pause' : 'Play'}
          tone="navy"
          disabled={!isPlayable}
          onPress={() => {
            if (status.playing) {
              player.pause();
            } else {
              player.play();
            }
          }}
        />
        <ActionButton
          label="Transcript"
          tone="signal"
          onPress={() => setShowTranscript((current) => !current)}
        />
        <ActionButton label="Als gehört" tone="mint" onPress={() => void onComplete()} />
      </View>

      <Text style={styles.progressLine}>
        {isPlayable
          ? `${Math.round(status.currentTime)}s / ${Math.round(status.duration)}s`
          : 'Kein lokales Audio-Modul gefunden.'}
      </Text>

      {children ? <View style={styles.embeddedContent}>{children}</View> : null}

      {showTranscript ? <Text style={styles.transcript}>{track.transcriptText}</Text> : null}
    </View>
  );
}

function ActionButton({
  label,
  tone,
  disabled,
  onPress,
}: {
  label: string;
  tone: 'navy' | 'signal' | 'mint';
  disabled?: boolean;
  onPress: () => void;
}) {
  const toneMap = {
    navy: { background: '#C9DDF4', text: palette.navy },
    signal: { background: '#F3C7AE', text: palette.signal },
    mint: { background: '#C7E6DA', text: palette.mint },
  } as const;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: toneMap[tone].background },
        disabled && styles.buttonDisabled,
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
  header: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '800',
  },
  prompt: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 21,
  },
  sourceRef: {
    color: palette.signal,
    fontSize: typography.small,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#D0DDED',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  statusBadgeDone: {
    backgroundColor: '#C7E6DA',
  },
  statusText: {
    color: palette.slate,
    fontSize: typography.small,
    fontWeight: '700',
  },
  statusTextDone: {
    color: palette.mint,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  progressLine: {
    color: palette.slate,
    fontSize: typography.small,
  },
  embeddedContent: {
    borderTopColor: palette.mist,
    borderTopWidth: 1,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  transcript: {
    color: palette.ink,
    fontSize: typography.body,
    lineHeight: 23,
  },
});
