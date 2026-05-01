import type { WorldObjectKind } from '@/world/types';

export type HubVisualAssetKey =
  | 'tile.grass.center'
  | 'tile.grass.edge'
  | 'tile.path.center'
  | 'tile.water.decor'
  | 'avatar.engineer.idle.south'
  | 'avatar.engineer.idle.north'
  | 'avatar.engineer.idle.east'
  | 'avatar.engineer.idle.west'
  | 'object.vocab_notebook'
  | 'object.unit1_signal_station'
  | 'object.progress_terminal'
  | 'object.settings_toolbox'
  | 'ui.interaction_prompt'
  | 'ui.dpad';

export type HubObjectVisualSlot = {
  worldObjectId: string;
  assetKey: HubVisualAssetKey;
  kind: WorldObjectKind;
  targetScale: number;
  tileFootprint: {
    width: number;
    depth: number;
  };
  heightHint: number;
  anchor: 'bottom-center';
  designNote: string;
};

export type HubVisualSpec = {
  approvedReference: string;
  rendererTarget: 'skia-2d';
  camera: {
    projection: 'fixed-isometric';
    tileWidth: number;
    tileHeight: number;
    tileDepth: number;
  };
  palette: {
    waterBright: string;
    waterDeep: string;
    grassTop: string;
    grassSide: string;
    pathSand: string;
    pathSide: string;
    engineeringYellow: string;
    safetyOrange: string;
    techBlue: string;
    terminalCyan: string;
    inkNavy: string;
    creamUi: string;
  };
  layoutRules: {
    objectScaleRule: string;
    walkableSpaceRule: string;
    labelRule: string;
    backgroundRule: string;
  };
  assets: HubVisualAssetKey[];
  objectSlots: HubObjectVisualSlot[];
};

export const hubVisualSpec: HubVisualSpec = {
  approvedReference: 'assets/images/concepts/engineering-quest-hub-approved.png',
  rendererTarget: 'skia-2d',
  camera: {
    projection: 'fixed-isometric',
    tileWidth: 96,
    tileHeight: 56,
    tileDepth: 24,
  },
  palette: {
    waterBright: '#11B8EA',
    waterDeep: '#0782B6',
    grassTop: '#8FEA67',
    grassSide: '#3FA34D',
    pathSand: '#F0C96D',
    pathSide: '#B8782B',
    engineeringYellow: '#FFD43B',
    safetyOrange: '#FF7A2E',
    techBlue: '#2F7DF4',
    terminalCyan: '#21C7D9',
    inkNavy: '#0A2342',
    creamUi: '#FFF3DE',
  },
  layoutRules: {
    objectScaleRule: 'Props sit on tiles and stay visibly smaller than menu buttons.',
    walkableSpaceRule: 'Keep open paths between all four hub props and the engineer spawn.',
    labelRule: 'No permanent text labels inside the playfield; use short prompts outside/at the edge.',
    backgroundRule: 'Use the approved reference as art direction, not as a final hotspot background.',
  },
  assets: [
    'tile.grass.center',
    'tile.grass.edge',
    'tile.path.center',
    'tile.water.decor',
    'avatar.engineer.idle.south',
    'avatar.engineer.idle.north',
    'avatar.engineer.idle.east',
    'avatar.engineer.idle.west',
    'object.vocab_notebook',
    'object.unit1_signal_station',
    'object.progress_terminal',
    'object.settings_toolbox',
    'ui.interaction_prompt',
    'ui.dpad',
  ],
  objectSlots: [
    {
      worldObjectId: 'hub-vocab-notebook',
      assetKey: 'object.vocab_notebook',
      kind: 'notebook',
      targetScale: 0.72,
      tileFootprint: { width: 0.72, depth: 0.62 },
      heightHint: 0.7,
      anchor: 'bottom-center',
      designNote: 'Small chunky notebook prop, readable as vocabulary but not oversized.',
    },
    {
      worldObjectId: 'hub-unit-1-gate',
      assetKey: 'object.unit1_signal_station',
      kind: 'unit_gate',
      targetScale: 0.82,
      tileFootprint: { width: 0.86, depth: 0.72 },
      heightHint: 1.15,
      anchor: 'bottom-center',
      designNote: 'Signal station or antenna gate, tallest hub prop but still walkable around it.',
    },
    {
      worldObjectId: 'hub-progress-terminal',
      assetKey: 'object.progress_terminal',
      kind: 'terminal',
      targetScale: 0.7,
      tileFootprint: { width: 0.72, depth: 0.62 },
      heightHint: 0.85,
      anchor: 'bottom-center',
      designNote: 'Cyan terminal with screen silhouette, compact and clearly separate from the notebook.',
    },
    {
      worldObjectId: 'hub-toolbox',
      assetKey: 'object.settings_toolbox',
      kind: 'toolbox',
      targetScale: 0.68,
      tileFootprint: { width: 0.72, depth: 0.58 },
      heightHint: 0.62,
      anchor: 'bottom-center',
      designNote: 'Red-orange toolbox prop, low and chunky so it reads as setup/settings.',
    },
  ],
};

export function getHubObjectVisualSlot(worldObjectId: string) {
  return hubVisualSpec.objectSlots.find((slot) => slot.worldObjectId === worldObjectId) ?? null;
}
