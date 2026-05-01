export type WorldId =
  | 'hub'
  | 'unit-1'
  | 'unit-1-section-a'
  | 'unit-1-section-b'
  | 'unit-1-section-c'
  | 'unit-1-section-d';

export type WorldMode = 'exploring' | 'interacting' | 'openingRoute';

export type WorldStateKey = `${WorldId}.${WorldMode}`;

export type WorldPosition = {
  x: number;
  y: number;
};

export type WorldDestination =
  | {
      type: 'route';
      route: string;
      label: string;
    }
  | {
      type: 'world';
      worldId: WorldId;
      label: string;
    }
  | {
      type: 'locked';
      label: string;
      message: string;
    };

export type WorldObjectKind =
  | 'notebook'
  | 'unit_gate'
  | 'terminal'
  | 'toolbox'
  | 'section_marker'
  | 'quiz_gate'
  | 'exit'
  | 'grammar_station'
  | 'vocab_station'
  | 'listening_station'
  | 'exercise_station';

export type WorldObject = {
  id: string;
  label: string;
  description: string;
  kind: WorldObjectKind;
  spriteKey: string;
  token?: string;
  position: WorldPosition;
  blocksMovement: boolean;
  interactionRadius?: number;
  destination: WorldDestination;
};

export type WorldTheme = {
  mapBackground: string;
  mapBorder: string;
  tileBackground: string;
  tileBorder: string;
  objectBackground: string;
  objectBorder: string;
  nearbyBackground: string;
  nearbyBorder: string;
};

export type WorldDefinition = {
  id: WorldId;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  startPosition: WorldPosition;
  theme: WorldTheme;
  objects: WorldObject[];
};

export type WorldState = {
  mode: WorldMode;
  worldId: WorldId;
  avatarPosition: WorldPosition;
  selectedObjectId: string | null;
  pendingDestination: WorldDestination | null;
  lastMessage: string | null;
};

export type WorldEvent =
  | { type: 'MOVE_UP' }
  | { type: 'MOVE_DOWN' }
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'INTERACT' }
  | { type: 'ENTER_WORLD'; worldId?: WorldId }
  | { type: 'EXIT_WORLD' }
  | { type: 'OPEN_ROUTE'; objectId?: string }
  | { type: 'COMPLETE_INTERACTION'; message?: string }
  | { type: 'CANCEL' }
  | { type: 'RESET' };
