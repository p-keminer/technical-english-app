import { useEffect, useState, type ComponentType } from 'react';
import { Image as RNImage, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { getHubObjectVisualSlot, hubVisualSpec } from '@/world/hub-visual-spec';
import type { WorldRendererEntity, WorldRendererProps, WorldRendererTile, WorldRendererTileKind } from '@/world/renderer-contract';
import type { WorldPosition } from '@/world/types';

type IsoPoint = {
  x: number;
  y: number;
};

type TileColors = {
  top: string;
  side: string;
  border: string;
};

type SkiaComponent = ComponentType<any>;

type SkiaComponents = {
  Canvas: SkiaComponent;
  Circle: SkiaComponent;
  Group: SkiaComponent;
  Path: SkiaComponent;
  Rect: SkiaComponent;
  RoundedRect: SkiaComponent;
};

let skiaComponents: SkiaComponents | null = null;
let skiaLoadPromise: Promise<void> | null = null;

const hubSpriteSources = {
  avatar: require('../../assets/images/world/sprites/hub-engineer.png'),
  'hub-vocab-notebook': require('../../assets/images/world/sprites/hub-vocab-notebook.png'),
  'hub-unit-1-gate': require('../../assets/images/world/sprites/hub-unit1-signal-station.png'),
  'hub-progress-terminal': require('../../assets/images/world/sprites/hub-progress-terminal.png'),
  'hub-toolbox': require('../../assets/images/world/sprites/hub-settings-toolbox.png'),
} as const;

export function SkiaHubWorldRenderer(props: WorldRendererProps) {
  const [isSkiaReady, setIsSkiaReady] = useState(() => skiaComponents !== null);

  useEffect(() => {
    let isMounted = true;

    loadSkiaComponents()
      .then(() => {
        if (isMounted) {
          setIsSkiaReady(true);
        }
      })
      .catch((error: unknown) => {
        console.error('Skia konnte nicht geladen werden.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isSkiaReady) {
    return <SkiaLoadingFallback prompt={props.prompt} />;
  }

  return <SkiaHubWorldRendererReady {...props} />;
}

function SkiaHubWorldRendererReady(props: WorldRendererProps) {
  const { map, nearbyObject, onInteract, onMove, prompt } = props;
  const paletteSpec = hubVisualSpec.palette;
  const sortedTiles = [...map.tiles].sort(sortByDepth);
  const surfaceTiles = sortedTiles.filter((tile) => tile.type === 'path' || (tile.type === 'grass' && tile.isNearby));
  const { Canvas, Path, Rect } = getSkiaComponents();

  return (
    <View style={styles.shell}>
      <View style={[styles.sceneCard, { backgroundColor: paletteSpec.waterBright, borderColor: paletteSpec.waterDeep }]}>
        <View style={[styles.canvasStage, { height: map.sceneHeight, width: map.sceneWidth }]}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Rect color={paletteSpec.waterBright} height={map.sceneHeight} width={map.sceneWidth} x={0} y={0} />
            <WaterMarks height={map.sceneHeight} width={map.sceneWidth} />
            <Path color="rgba(4, 78, 103, 0.18)" path={islandShadowPath(map.sceneWidth, map.sceneHeight)} start={0} end={1} />
            <IslandMass map={map} />
            <DockLayer map={map} />
            <EdgeDetailLayer map={map} />
            <TerrainDetail map={map} />
            {surfaceTiles.map((tile) => (
              <SkiaSurfaceTile key={tile.id} map={map} tile={tile} />
            ))}
          </Canvas>
          <SpriteLayer entities={props.entities} map={map} nearbyObjectId={nearbyObject?.id ?? null} />
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
          {prompt.message ? <Text style={styles.message}>{prompt.message}</Text> : null}
        </View>
        <Pressable onPress={onInteract} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
          <Text style={styles.actionButtonText}>Interagieren</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SpriteLayer({
  entities,
  map,
  nearbyObjectId,
}: {
  entities: WorldRendererEntity[];
  map: WorldRendererProps['map'];
  nearbyObjectId: string | null;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {entities.map((entity) => (
        <EntitySprite key={entity.id} entity={entity} map={map} nearbyObjectId={nearbyObjectId} />
      ))}
    </View>
  );
}

function EntitySprite({
  entity,
  map,
  nearbyObjectId,
}: {
  entity: WorldRendererEntity;
  map: WorldRendererProps['map'];
  nearbyObjectId: string | null;
}) {
  const center = toIsoCenter(entity.position, map);
  const baseY = center.y + map.tileHeight * 0.42;
  const scale = map.tileWidth / hubVisualSpec.camera.tileWidth;

  if (entity.type === 'avatar') {
    const width = 48 * scale;
    const height = 58 * scale;

    return (
      <RNImage
        resizeMode="contain"
        source={hubSpriteSources.avatar}
        style={[
          styles.sprite,
          {
            height,
            left: center.x - width / 2,
            top: baseY - height,
            width,
            zIndex: 120 + entity.position.x + entity.position.y,
          },
        ]}
      />
    );
  }

  const slot = getHubObjectVisualSlot(entity.id);
  const source = getObjectSpriteSource(entity.id);
  const targetScale = (slot?.targetScale ?? 0.72) * scale;
  const width = (entity.id === 'hub-unit-1-gate' ? 68 : 58) * targetScale;
  const height = (entity.id === 'hub-unit-1-gate' ? 72 : 58) * targetScale;
  const isNearby = nearbyObjectId === entity.id;

  return (
    <View
      style={[
        styles.spriteAnchor,
        {
          height: height + 18 * targetScale,
          left: center.x - width / 2 - 8 * targetScale,
          top: baseY - height - 13 * targetScale,
          width: width + 16 * targetScale,
          zIndex: 110 + entity.position.x + entity.position.y,
        },
      ]}>
      {isNearby ? <View style={styles.spriteInteractionHalo} /> : null}
      <RNImage resizeMode="contain" source={source} style={[styles.spriteImage, { height, width }]} />
    </View>
  );
}

function getObjectSpriteSource(objectId: string) {
  if (objectId in hubSpriteSources) {
    return hubSpriteSources[objectId as keyof typeof hubSpriteSources];
  }

  return hubSpriteSources['hub-vocab-notebook'];
}

function IslandMass({ map }: { map: WorldRendererProps['map'] }) {
  const { Group, Path } = getSkiaComponents();
  const bounds = getIslandBounds(map);
  const depth = Math.max(18, map.tileWidth * 0.22);

  return (
    <Group>
      <Path color="#8F4B1D" path={islandMassSidePath(bounds, depth + 16)} start={0} end={1} />
      <Path color="#C96E25" path={islandMassSidePath(bounds, depth + 8)} start={0} end={1} />
      <Path color="#3FA34D" path={islandMassSidePath(bounds, depth)} start={0} end={1} />
      <Path color="#8FEA67" path={islandMassTopPath(bounds)} start={0} end={1} />
      <Path color="rgba(255, 255, 255, 0.16)" path={innerIslandHighlightPath(bounds)} start={0} end={1} />
      <Path color="rgba(10, 35, 66, 0.2)" path={islandMassTopPath(bounds)} start={0} end={1} style="stroke" strokeWidth={2} />
    </Group>
  );
}

function TerrainDetail({ map }: { map: WorldRendererProps['map'] }) {
  const { Group, Path, RoundedRect } = getSkiaComponents();
  const grassTiles = map.tiles.filter((tile) => tile.type === 'grass' && !tile.hasObject);

  return (
    <Group>
      {grassTiles.map((tile, index) => {
        if (index % 3 === 1) {
          return null;
        }

        const center = toIsoCenter(tile.position, map);
        const xJitter = ((tile.position.x * 11 + tile.position.y * 5) % 13) - 6;
        const yJitter = ((tile.position.x * 7 + tile.position.y * 9) % 9) - 4;

        if (index % 3 === 0) {
          return (
            <Path
              key={tile.id}
              color="rgba(40, 146, 56, 0.24)"
              path={grassClusterPath(center.x + xJitter, center.y + yJitter, map.tileWidth)}
              start={0}
              end={1}
            />
          );
        }

        return (
          <RoundedRect
            key={tile.id}
            color="rgba(255, 255, 255, 0.2)"
            height={3}
            r={999}
            width={Math.max(10, map.tileWidth * 0.18)}
            x={center.x + xJitter - map.tileWidth * 0.08}
            y={center.y + yJitter}
          />
        );
      })}
    </Group>
  );
}

function EdgeDetailLayer({ map }: { map: WorldRendererProps['map'] }) {
  const { Group, Path } = getSkiaComponents();
  const bounds = getIslandBounds(map);
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const size = Math.max(9, map.tileWidth * 0.15);
  const clusters = [
    { id: 'edge-shrub-north-west', x: bounds.left + width * 0.23, y: bounds.top + height * 0.32, size: size * 0.86 },
    { id: 'edge-shrub-north-east', x: bounds.left + width * 0.74, y: bounds.top + height * 0.28, size: size * 0.78 },
    { id: 'edge-shrub-east', x: bounds.left + width * 0.88, y: bounds.top + height * 0.5, size: size * 0.72 },
    { id: 'edge-shrub-south-west', x: bounds.left + width * 0.35, y: bounds.top + height * 0.78, size },
  ];

  return (
    <Group>
      {clusters.map((cluster) => (
        <Group key={cluster.id}>
          <Path color="#2E8F45" path={voxelBlockSidePath(cluster.x, cluster.y, cluster.size)} start={0} end={1} />
          <Path color="#55C957" path={voxelBlockTopPath(cluster.x, cluster.y, cluster.size)} start={0} end={1} />
          <Path color="#2E8F45" path={voxelBlockSidePath(cluster.x + cluster.size * 0.72, cluster.y + cluster.size * 0.26, cluster.size * 0.7)} start={0} end={1} />
          <Path color="#71E266" path={voxelBlockTopPath(cluster.x + cluster.size * 0.72, cluster.y + cluster.size * 0.26, cluster.size * 0.7)} start={0} end={1} />
          <Path color="#22783E" path={voxelBlockSidePath(cluster.x - cluster.size * 0.54, cluster.y + cluster.size * 0.16, cluster.size * 0.62)} start={0} end={1} />
          <Path color="#43BA52" path={voxelBlockTopPath(cluster.x - cluster.size * 0.54, cluster.y + cluster.size * 0.16, cluster.size * 0.62)} start={0} end={1} />
        </Group>
      ))}
    </Group>
  );
}

function DockLayer({ map }: { map: WorldRendererProps['map'] }) {
  const { Group, Path } = getSkiaComponents();
  const dockConnection = toIsoCenter({ x: 1, y: map.height - 2 }, map);
  const baseX = dockConnection.x - map.tileWidth * 0.28;
  const baseY = dockConnection.y + map.tileHeight * 0.72;
  const plankWidth = Math.max(42, map.tileWidth * 0.74);
  const plankHeight = Math.max(18, map.tileHeight * 0.58);
  const plankDepth = Math.max(8, map.tileWidth * 0.13);
  const planks = [
    { x: baseX, y: baseY },
    { x: baseX - plankWidth * 0.54, y: baseY + plankHeight * 0.5 },
    { x: baseX - plankWidth * 1.08, y: baseY + plankHeight },
    { x: baseX - plankWidth * 1.62, y: baseY + plankHeight * 1.5 },
    { x: baseX - plankWidth * 2.16, y: baseY + plankHeight * 2 },
  ];

  return (
    <Group>
      {planks.map((plank, index) => (
        <Group key={`dock-plank-${index}`}>
          <Path color="#765033" path={dockPlankSidePath(plank.x, plank.y, plankWidth, plankHeight, plankDepth)} start={0} end={1} />
          <Path color={index % 2 === 0 ? '#C69A5E' : '#B8874D'} path={dockPlankTopPath(plank.x, plank.y, plankWidth, plankHeight)} start={0} end={1} />
          <Path
            color="rgba(76, 45, 24, 0.32)"
            path={dockPlankGrainPath(plank.x, plank.y, plankWidth, plankHeight)}
            start={0}
            end={1}
            style="stroke"
            strokeWidth={2}
          />
        </Group>
      ))}
    </Group>
  );
}

function SkiaLoadingFallback({ prompt }: { prompt: WorldRendererProps['prompt'] }) {
  return (
    <View style={styles.shell}>
      <View style={[styles.sceneCard, styles.loadingScene]}>
        <Text style={styles.loadingTitle}>Spielwelt wird geladen...</Text>
        <Text style={styles.loadingText}>CanvasKit wird fuer die Web-Vorschau vorbereitet.</Text>
      </View>
      <View style={styles.promptCard}>
        <View style={styles.promptCopy}>
          <Text style={styles.promptTitle}>{prompt.title}</Text>
          <Text style={styles.promptText}>{prompt.text}</Text>
        </View>
      </View>
    </View>
  );
}

function loadSkiaComponents() {
  skiaLoadPromise ??= loadSkiaComponentsOnce();
  return skiaLoadPromise;
}

async function loadSkiaComponentsOnce() {
  if (Platform.OS === 'web') {
    const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web/LoadSkiaWeb');
    await LoadSkiaWeb({
      locateFile: (file: string) => `/${file}`,
    });
  }

  const skia = await import('@shopify/react-native-skia');
  skiaComponents = {
    Canvas: skia.Canvas,
    Circle: skia.Circle,
    Group: skia.Group,
    Path: skia.Path,
    Rect: skia.Rect,
    RoundedRect: skia.RoundedRect,
  };
}

function getSkiaComponents() {
  if (!skiaComponents) {
    throw new Error('Skia-Komponenten wurden vor dem Rendern nicht geladen.');
  }

  return skiaComponents;
}

function WaterMarks({ height, width }: { height: number; width: number }) {
  const { Group, Path, RoundedRect } = getSkiaComponents();

  return (
    <Group opacity={0.55}>
      <RoundedRect color="#A4F4FF" height={5} r={999} width={68} x={28} y={36} />
      <RoundedRect color="#A4F4FF" height={5} r={999} width={62} x={width - 104} y={72} />
      <RoundedRect color="#A4F4FF" height={5} r={999} width={78} x={42} y={height - 54} />
      <RoundedRect color="#A4F4FF" height={4} r={999} width={46} x={width - 96} y={height - 92} />
      <Path color="#78DC63" path={miniIslandPath(20, height - 36, 18)} start={0} end={1} />
      <Path color="#3FA34D" path={miniIslandSidePath(20, height - 36, 18)} start={0} end={1} />
      <Path color="#78DC63" path={miniIslandPath(width - 28, 28, 15)} start={0} end={1} />
      <Path color="#3FA34D" path={miniIslandSidePath(width - 28, 28, 15)} start={0} end={1} />
    </Group>
  );
}

function SkiaSurfaceTile({
  map,
  tile,
}: {
  map: WorldRendererProps['map'];
  tile: WorldRendererTile;
}) {
  const { Group, Path } = getSkiaComponents();
  const center = toIsoCenter(tile.position, map);
  const colors = getSkiaTileColors(tile.type, tile.isNearby);
  const pathScale = getPathTileScale(tile, map);
  const width = map.tileWidth * pathScale;
  const height = map.tileHeight * pathScale;
  const depth = Math.max(10, map.tileWidth * 0.08);

  return (
    <Group>
      {tile.type === 'platform' || tile.isNearby ? <Path color={colors.side} path={diamondSidePath(center, width, height, depth)} start={0} end={1} /> : null}
      <Path color={colors.top} path={diamondPath(center, width, height)} start={0} end={1} />
      {tile.isNearby ? <Path color={colors.border} path={diamondPath(center, width, height)} start={0} end={1} style="stroke" strokeWidth={2.4} /> : null}
      {tile.type === 'path' ? <Path color="rgba(119, 82, 36, 0.22)" path={pathFleckPath(center, width, height)} start={0} end={1} /> : null}
    </Group>
  );
}

function getPathTileScale(tile: WorldRendererTile, map: WorldRendererProps['map']) {
  if (tile.type !== 'path') {
    return 1;
  }

  const isOuterEdge =
    tile.position.x === 0 ||
    tile.position.y === 0 ||
    tile.position.x === map.width - 1 ||
    tile.position.y === map.height - 1;

  return isOuterEdge ? 0.96 : 1.14;
}

function DpadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.dpadButton, pressed && styles.pressed]}>
      <Text style={styles.dpadButtonText}>{label}</Text>
    </Pressable>
  );
}

function toIsoCenter(position: WorldPosition, map: WorldRendererProps['map']): IsoPoint {
  const islandWidth = ((map.width + map.height) * map.tileWidth) / 2;
  const offsetX = (map.sceneWidth - islandWidth) / 2 + (map.height * map.tileWidth) / 2;

  return {
    x: offsetX + (position.x - position.y) * (map.tileWidth / 2),
    y: 44 + (position.x + position.y) * (map.tileHeight / 2),
  };
}

function sortByDepth(left: WorldRendererTile, right: WorldRendererTile) {
  const leftDepth = left.position.x + left.position.y;
  const rightDepth = right.position.x + right.position.y;
  return leftDepth - rightDepth || left.position.y - right.position.y;
}

function getSkiaTileColors(type: WorldRendererTileKind, isNearby: boolean): TileColors {
  const spec = hubVisualSpec.palette;
  if (isNearby) {
    return { top: '#FF9B3D', side: '#C55218', border: '#FFF3DE' };
  }
  if (type === 'platform') {
    return { top: spec.engineeringYellow, side: spec.pathSide, border: 'rgba(10, 35, 66, 0.2)' };
  }
  if (type === 'path') {
    return { top: spec.pathSand, side: spec.pathSide, border: 'rgba(10, 35, 66, 0.14)' };
  }
  return { top: spec.grassTop, side: spec.grassSide, border: 'rgba(10, 35, 66, 0.12)' };
}

function diamondPath(center: IsoPoint, width: number, height: number) {
  const left = center.x - width / 2;
  const right = center.x + width / 2;
  const top = center.y - height / 2;
  const bottom = center.y + height / 2;
  return `M ${center.x} ${top} L ${right} ${center.y} L ${center.x} ${bottom} L ${left} ${center.y} Z`;
}

function diamondSidePath(center: IsoPoint, width: number, height: number, depth: number) {
  const right = center.x + width / 2;
  const bottom = center.y + height / 2;
  const left = center.x - width / 2;
  return `M ${left} ${center.y} L ${center.x} ${bottom} L ${right} ${center.y} L ${right} ${center.y + depth} L ${center.x} ${bottom + depth} L ${left} ${center.y + depth} Z`;
}

function pathFleckPath(center: IsoPoint, width: number, height: number) {
  return `M ${center.x - width * 0.16} ${center.y + height * 0.02} L ${center.x - width * 0.02} ${center.y - height * 0.05} L ${center.x + width * 0.16} ${center.y + height * 0.02} L ${center.x + width * 0.04} ${center.y + height * 0.09} Z`;
}

function grassClusterPath(x: number, y: number, tileWidth: number) {
  const size = Math.max(8, tileWidth * 0.14);
  return `M ${x - size * 0.55} ${y} L ${x - size * 0.16} ${y - size * 0.28} L ${x + size * 0.16} ${y} L ${x + size * 0.55} ${y - size * 0.24} L ${x + size * 0.72} ${y + size * 0.1} L ${x + size * 0.12} ${y + size * 0.32} L ${x - size * 0.46} ${y + size * 0.22} Z`;
}

function voxelBlockTopPath(x: number, y: number, size: number) {
  return `M ${x} ${y - size * 0.42} L ${x + size * 0.72} ${y} L ${x} ${y + size * 0.42} L ${x - size * 0.72} ${y} Z`;
}

function voxelBlockSidePath(x: number, y: number, size: number) {
  const depth = size * 0.46;
  return `M ${x - size * 0.72} ${y} L ${x} ${y + size * 0.42} L ${x + size * 0.72} ${y} L ${x + size * 0.72} ${y + depth} L ${x} ${y + size * 0.42 + depth} L ${x - size * 0.72} ${y + depth} Z`;
}

function dockPlankTopPath(x: number, y: number, width: number, height: number) {
  return `M ${x - width * 0.5} ${y} L ${x} ${y - height * 0.5} L ${x + width * 0.5} ${y} L ${x} ${y + height * 0.5} Z`;
}

function dockPlankSidePath(x: number, y: number, width: number, height: number, depth: number) {
  return `M ${x - width * 0.5} ${y} L ${x} ${y + height * 0.5} L ${x + width * 0.5} ${y} L ${x + width * 0.5} ${y + depth} L ${x} ${y + height * 0.5 + depth} L ${x - width * 0.5} ${y + depth} Z`;
}

function dockPlankGrainPath(x: number, y: number, width: number, height: number) {
  return `M ${x - width * 0.18} ${y - height * 0.08} L ${x + width * 0.18} ${y + height * 0.08}`;
}

function miniIslandPath(x: number, y: number, size: number) {
  return `M ${x} ${y - size * 0.5} L ${x + size} ${y} L ${x} ${y + size * 0.5} L ${x - size} ${y} Z`;
}

function miniIslandSidePath(x: number, y: number, size: number) {
  return `M ${x - size} ${y} L ${x} ${y + size * 0.5} L ${x + size} ${y} L ${x + size} ${y + size * 0.28} L ${x} ${y + size * 0.78} L ${x - size} ${y + size * 0.28} Z`;
}

function islandShadowPath(width: number, height: number) {
  return `M ${width * 0.2} ${height * 0.74} C ${width * 0.38} ${height * 0.62}, ${width * 0.66} ${height * 0.62}, ${width * 0.82} ${height * 0.73} C ${width * 0.68} ${height * 0.87}, ${width * 0.34} ${height * 0.88}, ${width * 0.2} ${height * 0.74} Z`;
}

function getIslandBounds(map: WorldRendererProps['map']) {
  const centers = map.tiles.map((tile) => toIsoCenter(tile.position, map));
  const halfWidth = map.tileWidth * 0.98;
  const halfHeight = map.tileHeight * 1.08;
  const left = Math.min(...centers.map((center) => center.x - halfWidth));
  const right = Math.max(...centers.map((center) => center.x + halfWidth));
  const top = Math.min(...centers.map((center) => center.y - halfHeight));
  const bottom = Math.max(...centers.map((center) => center.y + halfHeight));

  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
  };
}

function islandMassTopPath(bounds: ReturnType<typeof getIslandBounds>) {
  const { bottom, centerX, left, right, top } = bounds;
  return `M ${centerX} ${top} L ${right} ${(top + bottom) / 2} L ${centerX} ${bottom} L ${left} ${(top + bottom) / 2} Z`;
}

function innerIslandHighlightPath(bounds: ReturnType<typeof getIslandBounds>) {
  const { bottom, centerX, left, right, top } = bounds;
  const insetX = Math.max(12, (right - left) * 0.04);
  const insetY = Math.max(8, (bottom - top) * 0.05);
  const middleY = (top + bottom) / 2;

  return `M ${centerX} ${top + insetY} L ${right - insetX} ${middleY} L ${centerX} ${bottom - insetY} L ${left + insetX} ${middleY} Z`;
}

function islandMassSidePath(bounds: ReturnType<typeof getIslandBounds>, depth: number) {
  const { bottom, centerX, left, right, top } = bounds;
  const middleY = (top + bottom) / 2;

  return `M ${left} ${middleY} L ${centerX} ${bottom} L ${right} ${middleY} L ${right} ${middleY + depth} L ${centerX} ${bottom + depth} L ${left} ${middleY + depth} Z`;
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
  canvasStage: {
    position: 'relative',
  },
  sprite: {
    position: 'absolute',
  },
  spriteAnchor: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'absolute',
  },
  spriteImage: {
    zIndex: 2,
  },
  spriteInteractionHalo: {
    backgroundColor: 'rgba(255, 143, 52, 0.28)',
    borderColor: 'rgba(255, 243, 222, 0.82)',
    borderRadius: 999,
    borderWidth: 2,
    bottom: 0,
    height: '54%',
    position: 'absolute',
    width: '92%',
    zIndex: 1,
  },
  loadingScene: {
    backgroundColor: '#11B8EA',
    borderColor: '#0782B6',
    justifyContent: 'center',
  },
  loadingTitle: {
    color: palette.cloud,
    fontSize: typography.cardTitle,
    fontWeight: '900',
  },
  loadingText: {
    color: palette.cloud,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.xs,
    opacity: 0.86,
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
