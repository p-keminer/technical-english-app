import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { SkiaHubWorldRenderer } from '@/components/skia-hub-world-renderer';
import { useLearningApp } from '@/providers/learning-app-provider';
import type { UnitQuizStatus, UnitVocabularySnapshot } from '@/types/content';
import type {
  WorldRendererEntity,
  WorldRendererMap,
  WorldRendererMovementDirection,
  WorldRendererPrompt,
  WorldRendererProps,
  WorldRendererTheme,
  WorldRendererTileKind,
} from '@/world/renderer-contract';
import type { WorldDestination, WorldId, WorldObject, WorldObjectKind, WorldPosition } from '@/world/types';
import { useWorld } from '@/world/world-context';

const objectTokens: Record<WorldObjectKind, string> = {
  notebook: 'VOC',
  unit_gate: 'U1',
  terminal: 'PROG',
  toolbox: 'SET',
  section_marker: 'SEC',
  quiz_gate: 'QUIZ',
  exit: 'HUB',
  grammar_station: 'GRAM',
  vocab_station: 'VOC',
  listening_station: 'AUD',
  exercise_station: 'EX',
};

const objectPalette: Record<WorldObjectKind, { main: string; side: string; trim: string; dark: string }> = {
  notebook: { main: '#2F72E8', side: '#1748A8', trim: '#F9EFA8', dark: '#0E2F75' },
  unit_gate: { main: '#FFB62E', side: '#C76A12', trim: '#FFF0A4', dark: '#754008' },
  terminal: { main: '#32C9D8', side: '#117785', trim: '#DFFFFF', dark: '#062E34' },
  toolbox: { main: '#F35A3D', side: '#A72A1C', trim: '#FFD8B7', dark: '#61150F' },
  section_marker: { main: '#8C66FF', side: '#4B2AA8', trim: '#E8DEFF', dark: '#2D176C' },
  quiz_gate: { main: '#77828E', side: '#424A54', trim: '#DDE5ED', dark: '#222832' },
  exit: { main: '#45B936', side: '#267A31', trim: '#E9FFE2', dark: '#11541D' },
  grammar_station: { main: '#FF7A3F', side: '#AA3D17', trim: '#FFE1C1', dark: '#6A210A' },
  vocab_station: { main: '#3276F4', side: '#1747A8', trim: '#E3F0FF', dark: '#0F2E6E' },
  listening_station: { main: '#35C6C8', side: '#11767E', trim: '#E0FFFF', dark: '#06383C' },
  exercise_station: { main: '#F45BAD', side: '#982468', trim: '#FFE2F1', dark: '#61113F' },
};

export function WorldPlayfield() {
  const { currentWorld, dispatch, nearbyObject, state } = useWorld();
  const learningApp = useLearningApp();
  const { width } = useWindowDimensions();
  const [unitOneVocabulary, setUnitOneVocabulary] = useState<UnitVocabularySnapshot | null>(() =>
    learningApp.getCachedUnitVocabularySnapshot('unit-1')
  );
  const theme = getSceneTheme(currentWorld.id);
  const activeDestination = getEffectiveDestination(nearbyObject, unitOneVocabulary);
  const quizGateHint = getQuizGateHint(nearbyObject, unitOneVocabulary);
  const maxTileWidth = currentWorld.id === 'hub' ? 66 : 76;
  const minTileWidth = currentWorld.id === 'hub' ? 42 : 48;
  const tileWidth = Math.min(
    maxTileWidth,
    Math.max(minTileWidth, Math.floor((width - spacing.md * 2 - 28) / ((currentWorld.width + currentWorld.height) * 0.5)))
  );
  const tileHeight = Math.round(tileWidth * 0.5);
  const sceneWidth = Math.round(((currentWorld.width + currentWorld.height) * tileWidth) / 2 + tileWidth * 0.95);
  const sceneHeight = Math.round(
    ((currentWorld.width + currentWorld.height) * tileHeight) / 2 + tileWidth * (currentWorld.id === 'hub' ? 2.65 : 2.2)
  );
  const tiles = Array.from({ length: currentWorld.height }, (_, y) =>
    Array.from({ length: currentWorld.width }, (_, x) => {
      const position = { x, y };
      const object = getObjectAt(currentWorld.objects, position);

      return {
        id: `${x}-${y}`,
        position,
        type: getTileType(currentWorld.id, position, Boolean(object)),
        hasObject: Boolean(object),
        isNearby: nearbyObject ? isSamePosition(nearbyObject.position, position) : false,
      };
    })
  ).flat();
  const renderMap: WorldRendererMap = {
    worldId: currentWorld.id,
    width: currentWorld.width,
    height: currentWorld.height,
    tileWidth,
    tileHeight,
    sceneWidth,
    sceneHeight,
    theme,
    tiles,
  };
  const sceneEntities: WorldRendererEntity[] = [
    ...currentWorld.objects.map((object) => ({
      type: 'object' as const,
      id: object.id,
      position: object.position,
      object,
      token: getObjectToken(object, unitOneVocabulary),
      colors: getObjectColors(object, unitOneVocabulary),
    })),
    { type: 'avatar' as const, id: 'avatar' as const, position: state.avatarPosition },
  ].sort((left, right) => {
    const leftDepth = left.position.x + left.position.y;
    const rightDepth = right.position.x + right.position.y;
    return leftDepth - rightDepth || left.position.y - right.position.y;
  });
  const prompt: WorldRendererPrompt = {
    title: nearbyObject ? nearbyObject.label : 'Erkunde die Insel',
    text: nearbyObject?.description ?? 'Laufe mit dem D-pad zu einem Objekt und tippe dann auf Interagieren.',
    destinationText: activeDestination ? getDestinationCopy(activeDestination) : null,
    message: state.lastMessage,
    quizStatus: quizGateHint,
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadQuizStatus() {
      const cached = learningApp.getCachedUnitVocabularySnapshot('unit-1');
      if (cached && !isCancelled) {
        setUnitOneVocabulary(cached);
      }

      const snapshot = await learningApp.getUnitVocabularySnapshot('unit-1');
      if (!isCancelled) {
        setUnitOneVocabulary(snapshot);
      }
    }

    void loadQuizStatus();
    return () => {
      isCancelled = true;
    };
  }, [learningApp, learningApp.isRefreshing]);

  function handleInteract() {
    if (!nearbyObject) {
      dispatch({ type: 'INTERACT' });
      return;
    }

    const destination = getEffectiveDestination(nearbyObject, unitOneVocabulary);
    if (!destination) {
      dispatch({ type: 'INTERACT' });
      return;
    }

    if (destination.type === 'route') {
      dispatch({ type: 'COMPLETE_INTERACTION', message: `${nearbyObject.label} geoeffnet.` });
      router.push(destination.route as Href);
      return;
    }

    if (destination.type === 'world') {
      dispatch({ type: 'ENTER_WORLD', worldId: destination.worldId });
      return;
    }

    dispatch({ type: 'COMPLETE_INTERACTION', message: destination.message });
  }

  function handleMove(direction: WorldRendererMovementDirection) {
    const eventByDirection = {
      up: 'MOVE_UP',
      down: 'MOVE_DOWN',
      left: 'MOVE_LEFT',
      right: 'MOVE_RIGHT',
    } as const;

    dispatch({ type: eventByDirection[direction] });
  }

  const rendererProps = {
    entities: sceneEntities,
    map: renderMap,
    nearbyObject,
    onInteract: handleInteract,
    onMove: handleMove,
    prompt,
  };

  return currentWorld.id === 'hub' ? (
    <SkiaHubWorldRenderer {...rendererProps} />
  ) : (
    <LegacyIsometricWorldRenderer {...rendererProps} />
  );
}

function LegacyIsometricWorldRenderer({
  entities,
  map,
  nearbyObject,
  onInteract,
  onMove,
  prompt,
}: WorldRendererProps) {
  const nearbyObjectEntity = nearbyObject
    ? entities.find((entity) => entity.type === 'object' && entity.id === nearbyObject.id)
    : null;

  return (
    <View style={styles.shell}>
      <View style={[styles.sceneCard, { backgroundColor: map.theme.water, borderColor: map.theme.edge }]}>
        <WaterDecor theme={map.theme} />

        <View style={[styles.scene, { height: map.sceneHeight, width: map.sceneWidth }]}>
          <View style={[styles.islandShadow, { backgroundColor: map.theme.islandShadow }]} />

          {map.tiles.map((tile) => {
            const iso = toIso(tile.position, map.width, map.height, map.tileWidth, map.tileHeight, map.sceneWidth);

            return (
              <IsoTile
                key={tile.id}
                isNearby={tile.isNearby}
                left={iso.left}
                theme={map.theme}
                tileHeight={map.tileHeight}
                tileType={tile.type}
                tileWidth={map.tileWidth}
                top={iso.top}
                zIndex={tile.position.x + tile.position.y}
              />
            );
          })}

          {entities.map((entity) => {
            const iso = toIso(entity.position, map.width, map.height, map.tileWidth, map.tileHeight, map.sceneWidth);
            const centerLeft = iso.left + map.tileWidth / 2;
            const groundTop = iso.top + map.tileHeight * 0.55;
            const zIndex = 80 + entity.position.x + entity.position.y;

            if (entity.type === 'avatar') {
              return (
                <View
                  key={entity.id}
                  style={[
                    styles.avatarWrap,
                    {
                      left: centerLeft - map.tileWidth * 0.25,
                      top: groundTop - map.tileWidth * 0.86,
                      width: map.tileWidth * 0.5,
                      zIndex,
                    },
                  ]}>
                  <EngineerAvatar size={map.tileWidth} />
                </View>
              );
            }

            return (
              <View
                key={entity.id}
                style={[
                  styles.objectWrap,
                  {
                    left: centerLeft - map.tileWidth * 0.38,
                    top: groundTop - map.tileWidth * 0.9,
                    width: map.tileWidth * 0.76,
                    zIndex,
                  },
                ]}>
                <WorldObjectSprite colors={entity.colors} object={entity.object} token={entity.token} />
              </View>
            );
          })}

          {nearbyObject ? (
            <ActiveObjectLabel
              object={nearbyObject}
              sceneWidth={map.sceneWidth}
              tileHeight={map.tileHeight}
              tileWidth={map.tileWidth}
              token={nearbyObjectEntity?.type === 'object' ? nearbyObjectEntity.token : objectTokens[nearbyObject.kind]}
              worldHeight={map.height}
              worldWidth={map.width}
            />
          ) : null}
        </View>

        <View style={styles.controlsDock}>
          <View style={styles.dpadGrid}>
            <View />
            <DpadButton label="UP" onPress={() => onMove('up')} />
            <View />
            <DpadButton label="LEFT" onPress={() => onMove('left')} />
            <DpadButton label="DOWN" onPress={() => onMove('down')} />
            <DpadButton label="RIGHT" onPress={() => onMove('right')} />
          </View>
        </View>
      </View>

      <View style={styles.promptCard}>
        <View style={styles.promptCopy}>
          <Text style={styles.promptTitle}>{prompt.title}</Text>
          <Text style={styles.promptText}>{prompt.text}</Text>
          {prompt.destinationText ? <Text style={styles.destinationText}>{prompt.destinationText}</Text> : null}
          {prompt.quizStatus ? (
            <View style={styles.quizStatusPill}>
              <Text style={styles.quizStatusTitle}>{prompt.quizStatus.title}</Text>
              <Text style={styles.quizStatusText}>{prompt.quizStatus.text}</Text>
            </View>
          ) : null}
          {prompt.message ? <Text style={styles.message}>{prompt.message}</Text> : null}
        </View>
        <Pressable onPress={onInteract} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
          <Text style={styles.actionButtonText}>Interagieren</Text>
        </Pressable>
      </View>
    </View>
  );
}

function IsoTile({
  isNearby,
  left,
  theme,
  tileHeight,
  tileType,
  tileWidth,
  top,
  zIndex,
}: {
  isNearby: boolean;
  left: number;
  theme: WorldRendererTheme;
  tileHeight: number;
  tileType: WorldRendererTileKind;
  tileWidth: number;
  top: number;
  zIndex: number;
}) {
  const colors = getTileColors(theme, tileType, isNearby);
  const diamond = tileWidth * 0.74;
  const depth = tileWidth * 0.18;

  return (
    <View
      style={[
        styles.isoTile,
        {
          height: tileWidth,
          left,
          top,
          width: tileWidth,
          zIndex,
        },
      ]}>
      <View
        style={[
          styles.isoTileDepth,
          {
            backgroundColor: colors.side,
            height: diamond,
            top: tileHeight * 0.42 + depth,
            width: diamond,
          },
        ]}
      />
      <View
        style={[
          styles.isoTileTop,
          {
            backgroundColor: colors.top,
            borderColor: colors.border,
            height: diamond,
            top: tileHeight * 0.18,
            width: diamond,
          },
        ]}>
        {tileType === 'grass' ? <View style={styles.grassFleck} /> : null}
        {tileType === 'path' ? <View style={styles.pathFleck} /> : null}
      </View>
    </View>
  );
}

function WorldObjectSprite({
  colors,
  object,
  token,
}: {
  colors: { main: string; side: string; trim: string; dark: string };
  object: WorldObject;
  token: string;
}) {
  return (
    <View style={styles.objectSprite}>
      <View style={styles.objectShadow} />
      {renderObjectTop(object.kind, colors)}
      <View style={[styles.objectCore, { backgroundColor: colors.main, borderColor: colors.trim }]}>
        {renderObjectFace(object.kind, colors, token)}
      </View>
      <View style={[styles.objectBase, { backgroundColor: colors.side }]} />
    </View>
  );
}

function renderObjectTop(kind: WorldObjectKind, colors: { main: string; side: string; trim: string; dark: string }) {
  if (kind === 'unit_gate' || kind === 'listening_station') {
    return (
      <View style={styles.dishAssembly}>
        <View style={[styles.dishPole, { backgroundColor: colors.dark }]} />
        <View style={[styles.dish, { backgroundColor: colors.trim, borderColor: colors.dark }]} />
      </View>
    );
  }

  if (kind === 'quiz_gate') {
    return (
      <View style={styles.gateTop}>
        <View style={[styles.gateLight, { backgroundColor: colors.trim }]} />
      </View>
    );
  }

  if (kind === 'toolbox') {
    return <View style={[styles.toolboxHandle, { borderColor: colors.dark }]} />;
  }

  if (kind === 'section_marker' || kind === 'grammar_station' || kind === 'exercise_station') {
    return <View style={[styles.objectBeacon, { backgroundColor: colors.trim, borderColor: colors.dark }]} />;
  }

  return <View style={[styles.objectCap, { backgroundColor: colors.trim, borderColor: colors.dark }]} />;
}

function renderObjectFace(
  kind: WorldObjectKind,
  colors: { main: string; side: string; trim: string; dark: string },
  token: string
) {
  if (kind === 'terminal') {
    return (
      <View style={styles.monitorFace}>
        <View style={styles.monitorBar} />
        <View style={[styles.monitorBar, styles.monitorBarSmall]} />
      </View>
    );
  }

  if (kind === 'notebook' || kind === 'vocab_station') {
    return (
      <View style={styles.bookFace}>
        <View style={styles.bookPage} />
        <View style={styles.bookPage} />
      </View>
    );
  }

  if (kind === 'quiz_gate') {
    return <Text style={[styles.objectMiniToken, { color: colors.trim }]}>{token}</Text>;
  }

  if (kind === 'exit') {
    return <View style={[styles.exitArrow, { borderTopColor: colors.trim }]} />;
  }

  return <View style={[styles.objectInset, { backgroundColor: colors.dark }]} />;
}

function EngineerAvatar({ size }: { size: number }) {
  return (
    <View style={styles.avatarSprite}>
      <View style={[styles.avatarHelmet, { height: size * 0.2, width: size * 0.42 }]} />
      <View style={[styles.avatarHead, { height: size * 0.26, width: size * 0.34 }]}>
        <View style={styles.avatarEyes}>
          <View style={styles.avatarEye} />
          <View style={styles.avatarEye} />
        </View>
      </View>
      <View style={[styles.avatarBody, { height: size * 0.32, width: size * 0.4 }]}>
        <View style={styles.avatarVest} />
      </View>
      <View style={styles.avatarLegs}>
        <View style={styles.avatarLeg} />
        <View style={styles.avatarLeg} />
      </View>
    </View>
  );
}

function ActiveObjectLabel({
  object,
  sceneWidth,
  tileHeight,
  tileWidth,
  token,
  worldHeight,
  worldWidth,
}: {
  object: WorldObject;
  sceneWidth: number;
  tileHeight: number;
  tileWidth: number;
  token: string;
  worldHeight: number;
  worldWidth: number;
}) {
  const iso = toIso(object.position, worldWidth, worldHeight, tileWidth, tileHeight, sceneWidth);

  return (
    <View
      style={[
        styles.activeLabel,
        {
          left: Math.max(8, Math.min(sceneWidth - 132, iso.left + tileWidth * 0.05)),
          top: Math.max(8, iso.top - tileWidth * 0.52),
        },
      ]}>
      <Text style={styles.activeLabelToken}>{token}</Text>
      <Text style={styles.activeLabelName} numberOfLines={1}>
        {object.label}
      </Text>
    </View>
  );
}

function DpadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.dpadButton, pressed && styles.pressed]}>
      <Text style={styles.dpadButtonText}>{label}</Text>
    </Pressable>
  );
}

function WaterDecor({ theme }: { theme: WorldRendererTheme }) {
  return (
    <>
      <View style={[styles.waterLine, { backgroundColor: theme.waterLine, left: 30, top: 38 }]} />
      <View style={[styles.waterLine, { backgroundColor: theme.waterLine, right: 42, top: 82 }]} />
      <View style={[styles.waterLine, { backgroundColor: theme.waterLine, left: 52, bottom: 46 }]} />
      <View style={[styles.miniIsland, { left: 16, bottom: 20 }]} />
      <View style={[styles.miniIsland, { right: 18, top: 18 }]} />
    </>
  );
}

function toIso(
  position: WorldPosition,
  worldWidth: number,
  worldHeight: number,
  tileWidth: number,
  tileHeight: number,
  sceneWidth: number
) {
  const islandWidth = ((worldWidth + worldHeight) * tileWidth) / 2;
  const offsetX = (sceneWidth - islandWidth) / 2 + (worldHeight * tileWidth) / 2 - tileWidth / 2;

  return {
    left: offsetX + (position.x - position.y) * (tileWidth / 2),
    top: 42 + (position.x + position.y) * (tileHeight / 2),
  };
}

function getObjectAt(objects: WorldObject[], position: WorldPosition) {
  return objects.find((object) => isSamePosition(object.position, position)) ?? null;
}

function isSamePosition(a: WorldPosition, b: WorldPosition) {
  return a.x === b.x && a.y === b.y;
}

function getTileType(worldId: WorldId, position: WorldPosition, hasObject: boolean): WorldRendererTileKind {
  if (hasObject) {
    return 'platform';
  }

  if (worldId === 'hub') {
    const mainNorthSouth = position.x === 4 && position.y >= 2 && position.y <= 6;
    const mainWestEast = position.y === 4 && position.x >= 2 && position.x <= 7;
    const dockBranch = position.y === 6 && position.x >= 1 && position.x <= 4;
    const northBranch = position.y === 2 && position.x >= 3 && position.x <= 6;
    const lowerBranch = position.y === 5 && position.x >= 4 && position.x <= 6;

    return mainNorthSouth || mainWestEast || dockBranch || northBranch || lowerBranch ? 'path' : 'grass';
  }

  if (worldId === 'unit-1') {
    return position.x === 3 || position.y === 2 || position.y === 5 ? 'path' : 'grass';
  }

  return position.x === 3 || position.y === 3 ? 'path' : 'grass';
}

function getTileColors(theme: WorldRendererTheme, tileType: WorldRendererTileKind, isNearby: boolean) {
  if (isNearby) {
    return { top: theme.selectedTop, side: theme.selectedSide, border: '#FFFFFF' };
  }

  if (tileType === 'platform') {
    return { top: theme.platformTop, side: theme.platformSide, border: 'rgba(10,35,66,0.22)' };
  }

  if (tileType === 'path') {
    return { top: theme.pathTop, side: theme.pathSide, border: 'rgba(10,35,66,0.15)' };
  }

  return { top: theme.grassTop, side: theme.grassSide, border: 'rgba(10,35,66,0.12)' };
}

function getSceneTheme(worldId: WorldId): WorldRendererTheme {
  if (worldId === 'unit-1') {
    return {
      water: '#12B9ED',
      waterLine: 'rgba(200,250,255,0.58)',
      islandShadow: 'rgba(7,70,95,0.18)',
      grassTop: '#8EEB73',
      grassSide: '#43A94B',
      pathTop: '#D7B786',
      pathSide: '#9E7650',
      platformTop: '#F7D25F',
      platformSide: '#BE7A1F',
      selectedTop: '#FF8F34',
      selectedSide: '#C94D13',
      edge: '#0879A5',
    };
  }

  if (worldId.includes('section-a')) {
    return {
      water: '#0DBBD9',
      waterLine: 'rgba(220,255,255,0.54)',
      islandShadow: 'rgba(4,82,98,0.18)',
      grassTop: '#8DF0E5',
      grassSide: '#2C9DA1',
      pathTop: '#F2D88B',
      pathSide: '#B8892E',
      platformTop: '#FFE36B',
      platformSide: '#C37A1D',
      selectedTop: '#FF8F34',
      selectedSide: '#C94D13',
      edge: '#087583',
    };
  }

  if (worldId.includes('section-b')) {
    return {
      water: '#55A6F7',
      waterLine: 'rgba(213,236,255,0.52)',
      islandShadow: 'rgba(27,72,118,0.18)',
      grassTop: '#BCCBFF',
      grassSide: '#6577D8',
      pathTop: '#E8D8BA',
      pathSide: '#A98C60',
      platformTop: '#FFB86B',
      platformSide: '#B45C19',
      selectedTop: '#FFE06B',
      selectedSide: '#C78314',
      edge: '#3157AA',
    };
  }

  if (worldId.includes('section-c')) {
    return {
      water: '#10AEEA',
      waterLine: 'rgba(202,255,255,0.52)',
      islandShadow: 'rgba(121,65,15,0.18)',
      grassTop: '#FFD07D',
      grassSide: '#C87525',
      pathTop: '#C1F09A',
      pathSide: '#60A54A',
      platformTop: '#7CE68E',
      platformSide: '#268947',
      selectedTop: '#36E090',
      selectedSide: '#14744B',
      edge: '#9A4F16',
    };
  }

  if (worldId.includes('section-d')) {
    return {
      water: '#48A7F4',
      waterLine: 'rgba(213,236,255,0.52)',
      islandShadow: 'rgba(73,52,130,0.18)',
      grassTop: '#D6C4FF',
      grassSide: '#8164D1',
      pathTop: '#9FE3FF',
      pathSide: '#318FC4',
      platformTop: '#FFE06B',
      platformSide: '#C78314',
      selectedTop: '#FF8F34',
      selectedSide: '#C94D13',
      edge: '#6140A8',
    };
  }

  return {
    water: '#12B9ED',
    waterLine: 'rgba(200,250,255,0.58)',
    islandShadow: 'rgba(7,70,95,0.18)',
    grassTop: '#A6F36E',
    grassSide: '#54AD4A',
    pathTop: '#F1D389',
    pathSide: '#B5862F',
    platformTop: '#FFE06B',
    platformSide: '#C37A1D',
    selectedTop: '#FF8F34',
    selectedSide: '#C94D13',
    edge: '#0879A5',
  };
}

function getObjectColors(object: WorldObject, unitOneVocabulary: UnitVocabularySnapshot | null) {
  if (object.kind !== 'quiz_gate') {
    return objectPalette[object.kind];
  }

  const status = getQuizGateStatus(unitOneVocabulary);
  if (status === 'ready') {
    return { main: '#FFD232', side: '#B87A10', trim: '#FFF3A8', dark: '#6D4705' };
  }
  if (status === 'passed') {
    return { main: '#4DDC76', side: '#1F9145', trim: '#D9FFE2', dark: '#0E5428' };
  }
  if (status === 'skipped') {
    return { main: '#63B3FF', side: '#2667B8', trim: '#E2F3FF', dark: '#123C76' };
  }

  return objectPalette.quiz_gate;
}

const quizStatusLabelMap: Record<UnitQuizStatus, string> = {
  locked: 'Gesperrt',
  ready: 'Bereit',
  passed: 'Bestanden',
  skipped: 'Uebersprungen',
};

function getQuizGateStatus(unitOneVocabulary: UnitVocabularySnapshot | null): UnitQuizStatus {
  return unitOneVocabulary?.quiz.status ?? 'locked';
}

function getObjectToken(object: WorldObject, unitOneVocabulary: UnitVocabularySnapshot | null) {
  if (object.kind !== 'quiz_gate') {
    return object.token ?? objectTokens[object.kind];
  }

  const status = getQuizGateStatus(unitOneVocabulary);
  const statusTokens: Record<UnitQuizStatus, string> = {
    locked: 'LOCK',
    ready: 'GO',
    passed: 'DONE',
    skipped: 'SKIP',
  };

  return statusTokens[status];
}

function getEffectiveDestination(
  object: WorldObject | null,
  unitOneVocabulary: UnitVocabularySnapshot | null
): WorldDestination | null {
  if (!object) {
    return null;
  }

  if (object.kind !== 'quiz_gate') {
    return object.destination;
  }

  const status = getQuizGateStatus(unitOneVocabulary);
  if (status === 'locked') {
    return {
      type: 'locked',
      label: 'Unit-1-Abschlussquiz',
      message: 'Das Abschlussquiz ist noch gesperrt. Erledige zuerst alle Unit-1-Uebungen.',
    };
  }

  return {
    type: 'route',
    route: '/quiz/unit-1?returnWorld=unit-1',
    label:
      status === 'ready'
        ? 'Unit-1-Abschlussquiz starten'
        : `Unit-1-Abschlussquiz (${quizStatusLabelMap[status]})`,
  };
}

function getDestinationCopy(destination: WorldDestination) {
  if (destination.type === 'locked') {
    return destination.message;
  }

  return `Ziel: ${destination.label}`;
}

function getQuizGateHint(object: WorldObject | null, unitOneVocabulary: UnitVocabularySnapshot | null) {
  if (object?.kind !== 'quiz_gate') {
    return null;
  }

  const status = getQuizGateStatus(unitOneVocabulary);
  const vocabularyProgress = unitOneVocabulary
    ? `${unitOneVocabulary.learnedCount}/${unitOneVocabulary.totalCount} Vokabeln gemerkt`
    : 'Quizstatus wird geladen';

  const hintByStatus: Record<UnitQuizStatus, string> = {
    locked: 'Noch nicht betretbar. Sobald alle Unit-Uebungen erledigt sind, oeffnet dieses Gate das Abschlussquiz.',
    ready: 'Bereit. Interagieren startet das Vokabel-Abschlussquiz fuer Unit 1.',
    passed: 'Bestanden. Interagieren zeigt dir die Quiz-Zusammenfassung.',
    skipped: 'Uebersprungen. Interagieren zeigt dir die Freigabe-Zusammenfassung.',
  };

  return {
    title: `Quiz-Gate: ${quizStatusLabelMap[status]}`,
    text: `${hintByStatus[status]} ${vocabularyProgress}.`,
  };
}

const styles = StyleSheet.create({
  shell: {
    gap: spacing.md,
  },
  sceneCard: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 4,
    minHeight: 360,
    overflow: 'hidden',
    padding: spacing.sm,
    position: 'relative',
    ...shadows.card,
  },
  scene: {
    position: 'relative',
  },
  islandShadow: {
    borderRadius: 999,
    bottom: 40,
    height: 46,
    left: 30,
    position: 'absolute',
    right: 30,
    transform: [{ rotateZ: '-5deg' }],
  },
  waterLine: {
    borderRadius: radius.pill,
    height: 5,
    opacity: 0.95,
    position: 'absolute',
    transform: [{ rotateZ: '-18deg' }],
    width: 64,
  },
  miniIsland: {
    backgroundColor: '#A6F36E',
    borderBottomColor: '#54AD4A',
    borderBottomWidth: 8,
    borderColor: 'rgba(255,255,255,0.72)',
    borderRadius: 9,
    borderWidth: 2,
    height: 24,
    position: 'absolute',
    transform: [{ rotateZ: '45deg' }, { scaleY: 0.58 }],
    width: 24,
  },
  isoTile: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'absolute',
  },
  isoTileDepth: {
    borderRadius: 9,
    opacity: 0.95,
    position: 'absolute',
    transform: [{ rotateZ: '45deg' }, { scaleY: 0.56 }],
  },
  isoTileTop: {
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    position: 'absolute',
    transform: [{ rotateZ: '45deg' }, { scaleY: 0.56 }],
  },
  grassFleck: {
    backgroundColor: 'rgba(14, 105, 40, 0.18)',
    borderRadius: 3,
    height: 6,
    transform: [{ rotateZ: '24deg' }],
    width: 14,
  },
  pathFleck: {
    backgroundColor: 'rgba(123, 88, 42, 0.18)',
    borderRadius: 3,
    height: 6,
    transform: [{ rotateZ: '-18deg' }],
    width: 16,
  },
  objectWrap: {
    alignItems: 'center',
    position: 'absolute',
  },
  objectSprite: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectShadow: {
    backgroundColor: 'rgba(7, 37, 49, 0.2)',
    borderRadius: 999,
    bottom: -8,
    height: 14,
    position: 'absolute',
    width: 48,
  },
  objectCap: {
    borderRadius: 7,
    borderWidth: 2,
    height: 11,
    marginBottom: -3,
    width: 42,
  },
  objectCore: {
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 2,
    height: 38,
    justifyContent: 'center',
    width: 50,
  },
  objectBase: {
    borderRadius: 5,
    height: 8,
    marginTop: -1,
    width: 43,
  },
  dishAssembly: {
    alignItems: 'center',
    height: 29,
    marginBottom: -4,
  },
  dishPole: {
    borderRadius: 3,
    height: 16,
    marginTop: 10,
    width: 7,
  },
  dish: {
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    marginTop: -28,
    transform: [{ rotateZ: '-22deg' }],
    width: 30,
  },
  gateTop: {
    alignItems: 'center',
    height: 23,
    marginBottom: -3,
  },
  gateLight: {
    borderRadius: 4,
    height: 15,
    marginTop: 2,
    transform: [{ rotateZ: '45deg' }],
    width: 15,
  },
  toolboxHandle: {
    borderRadius: 5,
    borderTopWidth: 4,
    height: 13,
    marginBottom: -4,
    width: 30,
  },
  objectBeacon: {
    borderRadius: 999,
    borderWidth: 2,
    height: 16,
    marginBottom: -3,
    width: 16,
  },
  monitorFace: {
    backgroundColor: '#071929',
    borderColor: '#BDFBFF',
    borderRadius: 4,
    borderWidth: 2,
    gap: 3,
    height: 23,
    justifyContent: 'flex-end',
    padding: 4,
    width: 34,
  },
  monitorBar: {
    backgroundColor: '#32C9D8',
    borderRadius: 3,
    height: 4,
    width: 21,
  },
  monitorBarSmall: {
    width: 13,
  },
  bookFace: {
    flexDirection: 'row',
    gap: 3,
  },
  bookPage: {
    backgroundColor: '#FFF8EF',
    borderRadius: 2,
    height: 23,
    width: 14,
  },
  objectMiniToken: {
    fontSize: 9,
    fontWeight: '900',
  },
  exitArrow: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 10,
    borderRightColor: 'transparent',
    borderRightWidth: 10,
    borderTopWidth: 18,
    height: 0,
    transform: [{ rotateZ: '-90deg' }],
    width: 0,
  },
  objectInset: {
    borderRadius: 4,
    height: 20,
    opacity: 0.42,
    width: 28,
  },
  avatarWrap: {
    alignItems: 'center',
    position: 'absolute',
  },
  avatarSprite: {
    alignItems: 'center',
  },
  avatarHelmet: {
    backgroundColor: '#FFD232',
    borderColor: '#0A2342',
    borderRadius: 9,
    borderWidth: 2,
    marginBottom: -3,
  },
  avatarHead: {
    alignItems: 'center',
    backgroundColor: '#FFD8B5',
    borderColor: '#0A2342',
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
  },
  avatarEyes: {
    flexDirection: 'row',
    gap: 7,
  },
  avatarEye: {
    backgroundColor: '#0A2342',
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  avatarBody: {
    alignItems: 'center',
    backgroundColor: '#1E66D0',
    borderColor: '#0A2342',
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    marginTop: -2,
  },
  avatarVest: {
    backgroundColor: '#FF8F34',
    borderRadius: 2,
    height: 14,
    width: 8,
  },
  avatarLegs: {
    flexDirection: 'row',
    gap: 5,
    marginTop: -2,
  },
  avatarLeg: {
    backgroundColor: '#0A2342',
    borderRadius: 3,
    height: 10,
    width: 8,
  },
  activeLabel: {
    alignItems: 'center',
    backgroundColor: '#45B936',
    borderColor: '#E9FFE2',
    borderRadius: 9,
    borderWidth: 2,
    minWidth: 110,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute',
    zIndex: 220,
  },
  activeLabelToken: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  activeLabelName: {
    color: '#F4FFE9',
    fontSize: 10,
    fontWeight: '900',
    maxWidth: 132,
  },
  controlsDock: {
    backgroundColor: 'rgba(10, 35, 66, 0.74)',
    borderColor: 'rgba(255, 248, 239, 0.72)',
    borderRadius: radius.md,
    borderWidth: 2,
    bottom: spacing.sm,
    padding: spacing.xs,
    position: 'absolute',
    right: spacing.sm,
    zIndex: 300,
  },
  dpadGrid: {
    columnGap: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 154,
    rowGap: spacing.xs,
  },
  dpadButton: {
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    borderBottomColor: '#B7A78F',
    borderBottomWidth: 4,
    borderColor: '#0A2342',
    borderRadius: radius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 40,
    width: 46,
  },
  dpadButtonText: {
    color: palette.navy,
    fontSize: 9,
    fontWeight: '900',
  },
  promptCard: {
    backgroundColor: '#FFF8EF',
    borderColor: '#0A2342',
    borderRadius: radius.lg,
    borderWidth: 3,
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  promptCopy: {
    gap: spacing.xs,
  },
  promptTitle: {
    color: palette.ink,
    fontSize: typography.cardTitle,
    fontWeight: '900',
  },
  promptText: {
    color: palette.slate,
    fontSize: typography.body,
    lineHeight: 21,
  },
  destinationText: {
    color: palette.navy,
    fontSize: typography.small,
    fontWeight: '900',
  },
  message: {
    color: palette.signal,
    fontSize: typography.body,
    fontWeight: '900',
  },
  quizStatusPill: {
    backgroundColor: '#FFE06B',
    borderColor: '#A86B0C',
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  quizStatusTitle: {
    color: palette.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  quizStatusText: {
    color: palette.navy,
    fontSize: typography.small,
    lineHeight: 18,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#0A2342',
    borderBottomColor: '#061427',
    borderBottomWidth: 5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionButtonText: {
    color: palette.cloud,
    fontSize: typography.body,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ translateY: 2 }],
  },
});
