import { getWorldDefinition } from '@/world/world-definitions';
import type { WorldDestination, WorldEvent, WorldId, WorldObject, WorldPosition, WorldState, WorldStateKey } from '@/world/types';

const movementDelta: Record<'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_LEFT' | 'MOVE_RIGHT', WorldPosition> = {
  MOVE_UP: { x: 0, y: -1 },
  MOVE_DOWN: { x: 0, y: 1 },
  MOVE_LEFT: { x: -1, y: 0 },
  MOVE_RIGHT: { x: 1, y: 0 },
};

export function createInitialWorldState(worldId: WorldId = 'hub'): WorldState {
  const world = getWorldDefinition(worldId);

  return {
    mode: 'exploring',
    worldId,
    avatarPosition: world.startPosition,
    selectedObjectId: null,
    pendingDestination: null,
    lastMessage: null,
  };
}

export function getWorldStateKey(state: WorldState): WorldStateKey {
  return `${state.worldId}.${state.mode}`;
}

export function getObjectById(worldId: WorldId, objectId: string | null): WorldObject | null {
  if (!objectId) {
    return null;
  }

  return getWorldDefinition(worldId).objects.find((object) => object.id === objectId) ?? null;
}

export function getNearbyObject(state: WorldState): WorldObject | null {
  const world = getWorldDefinition(state.worldId);

  return (
    world.objects.find((object) => {
      const radius = object.interactionRadius ?? 1;
      return getManhattanDistance(state.avatarPosition, object.position) <= radius;
    }) ?? null
  );
}

export function worldReducer(state: WorldState, event: WorldEvent): WorldState {
  switch (event.type) {
    case 'MOVE_UP':
    case 'MOVE_DOWN':
    case 'MOVE_LEFT':
    case 'MOVE_RIGHT':
      return moveAvatar(state, event.type);
    case 'INTERACT':
      return startInteraction(state);
    case 'ENTER_WORLD':
      return enterWorld(state, event.worldId);
    case 'EXIT_WORLD':
      return state.worldId === 'hub'
        ? withMessage(state, 'Du bist bereits im Hub.')
        : withMessage(createInitialWorldState('hub'), 'Zurueck im Engineering Hub.');
    case 'OPEN_ROUTE':
      return openSelectedRoute(state, event.objectId);
    case 'COMPLETE_INTERACTION':
      return completeInteraction(state, event.message);
    case 'CANCEL':
      return cancelInteraction(state);
    case 'RESET':
      return createInitialWorldState('hub');
    default:
      return state;
  }
}

function moveAvatar(state: WorldState, eventType: keyof typeof movementDelta): WorldState {
  if (state.mode !== 'exploring') {
    return withMessage(state, 'Bewegung ist nur im exploring-Zustand erlaubt.');
  }

  const world = getWorldDefinition(state.worldId);
  const delta = movementDelta[eventType];
  const nextPosition = {
    x: state.avatarPosition.x + delta.x,
    y: state.avatarPosition.y + delta.y,
  };

  if (!isInsideWorld(nextPosition, world.width, world.height)) {
    return withMessage(state, 'Grenze erreicht: Die Figur bleibt innerhalb der Map.');
  }

  const blockingObject = world.objects.find(
    (object) => object.blocksMovement && isSamePosition(object.position, nextPosition)
  );

  if (blockingObject) {
    return withMessage(state, `Blockiert durch ${blockingObject.label}.`);
  }

  return {
    ...state,
    avatarPosition: nextPosition,
    selectedObjectId: null,
    pendingDestination: null,
    lastMessage: null,
  };
}

function startInteraction(state: WorldState): WorldState {
  if (state.mode !== 'exploring') {
    return withMessage(state, 'Interaktion ist nur im exploring-Zustand moeglich.');
  }

  const nearbyObject = getNearbyObject(state);
  if (!nearbyObject) {
    return withMessage(state, 'Kein Objekt in Reichweite.');
  }

  return {
    ...state,
    mode: 'interacting',
    selectedObjectId: nearbyObject.id,
    pendingDestination: null,
    lastMessage: `${nearbyObject.label} ausgewaehlt.`,
  };
}

function enterWorld(state: WorldState, explicitWorldId?: WorldId): WorldState {
  const selectedObject = getObjectById(state.worldId, state.selectedObjectId);
  const destination = selectedObject?.destination;
  const nextWorldId = explicitWorldId ?? (destination?.type === 'world' ? destination.worldId : null);

  if (!nextWorldId) {
    return withMessage(state, 'Das ausgewaehlte Objekt fuehrt in keine Welt.');
  }

  return withMessage(createInitialWorldState(nextWorldId), `${getWorldDefinition(nextWorldId).title} betreten.`);
}

function openSelectedRoute(state: WorldState, objectId?: string): WorldState {
  const selectedObject = getObjectById(state.worldId, objectId ?? state.selectedObjectId);

  if (!selectedObject) {
    return withMessage(state, 'Kein Objekt ausgewaehlt.');
  }

  if (selectedObject.destination.type === 'locked') {
    return withMessage(state, selectedObject.destination.message);
  }

  if (selectedObject.destination.type !== 'route') {
    return withMessage(state, 'Das ausgewaehlte Objekt ist keine Route.');
  }

  return {
    ...state,
    mode: 'openingRoute',
    selectedObjectId: selectedObject.id,
    pendingDestination: selectedObject.destination,
    lastMessage: `Route bereit: ${selectedObject.destination.route}`,
  };
}

function cancelInteraction(state: WorldState): WorldState {
  if (state.mode === 'exploring') {
    return withMessage(state, 'Nichts zum Abbrechen.');
  }

  return {
    ...state,
    mode: 'exploring',
    selectedObjectId: null,
    pendingDestination: null,
    lastMessage: 'Interaktion abgebrochen.',
  };
}

function completeInteraction(state: WorldState, message = 'Zurueck im exploring-Zustand.'): WorldState {
  return {
    ...state,
    mode: 'exploring',
    selectedObjectId: null,
    pendingDestination: null,
    lastMessage: message,
  };
}

function withMessage(state: WorldState, lastMessage: string): WorldState {
  return {
    ...state,
    lastMessage,
  };
}

function isInsideWorld(position: WorldPosition, width: number, height: number) {
  return position.x >= 0 && position.y >= 0 && position.x < width && position.y < height;
}

function isSamePosition(a: WorldPosition, b: WorldPosition) {
  return a.x === b.x && a.y === b.y;
}

function getManhattanDistance(a: WorldPosition, b: WorldPosition) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function describeDestination(destination: WorldDestination | null) {
  if (!destination) {
    return 'Keine';
  }

  if (destination.type === 'route') {
    return `Route: ${destination.route}`;
  }

  if (destination.type === 'world') {
    return `Welt: ${destination.worldId}`;
  }

  return `Gesperrt: ${destination.message}`;
}
