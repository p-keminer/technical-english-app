import type { WorldId, WorldObject, WorldPosition } from '@/world/types';

export type WorldRendererRuntime = 'legacy-react-native' | 'skia-2d';

export const WORLD_RENDERER_TARGET: WorldRendererRuntime = 'skia-2d';

export type WorldRendererMovementDirection = 'up' | 'down' | 'left' | 'right';

export type WorldRendererTheme = {
  water: string;
  waterLine: string;
  islandShadow: string;
  grassTop: string;
  grassSide: string;
  pathTop: string;
  pathSide: string;
  platformTop: string;
  platformSide: string;
  selectedTop: string;
  selectedSide: string;
  edge: string;
};

export type WorldRendererTileKind = 'grass' | 'path' | 'platform';

export type WorldRendererTile = {
  id: string;
  position: WorldPosition;
  type: WorldRendererTileKind;
  hasObject: boolean;
  isNearby: boolean;
};

export type WorldRendererObjectColors = {
  main: string;
  side: string;
  trim: string;
  dark: string;
};

export type WorldRendererMap = {
  worldId: WorldId;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  sceneWidth: number;
  sceneHeight: number;
  theme: WorldRendererTheme;
  tiles: WorldRendererTile[];
};

export type WorldRendererEntity =
  | { type: 'avatar'; id: 'avatar'; position: WorldPosition }
  | {
      type: 'object';
      id: string;
      position: WorldPosition;
      object: WorldObject;
      token: string;
      colors: WorldRendererObjectColors;
    };

export type WorldRendererPrompt = {
  title: string;
  text: string;
  destinationText: string | null;
  message: string | null;
  quizStatus:
    | {
        title: string;
        text: string;
      }
    | null;
};

export type WorldRendererProps = {
  map: WorldRendererMap;
  entities: WorldRendererEntity[];
  nearbyObject: WorldObject | null;
  prompt: WorldRendererPrompt;
  onMove: (direction: WorldRendererMovementDirection) => void;
  onInteract: () => void;
};
