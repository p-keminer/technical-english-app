import { createContext, type PropsWithChildren, useContext, useMemo, useReducer } from 'react';

import { getWorldDefinition } from '@/world/world-definitions';
import {
  createInitialWorldState,
  getNearbyObject,
  getObjectById,
  getWorldStateKey,
  worldReducer,
} from '@/world/world-machine';
import type { WorldDefinition, WorldEvent, WorldObject, WorldState, WorldStateKey } from '@/world/types';

type WorldContextValue = {
  state: WorldState;
  stateKey: WorldStateKey;
  currentWorld: WorldDefinition;
  nearbyObject: WorldObject | null;
  selectedObject: WorldObject | null;
  dispatch: (event: WorldEvent) => void;
};

const WorldContext = createContext<WorldContextValue | null>(null);

export function WorldProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(worldReducer, undefined, () => createInitialWorldState('hub'));

  const value = useMemo<WorldContextValue>(() => {
    return {
      state,
      stateKey: getWorldStateKey(state),
      currentWorld: getWorldDefinition(state.worldId),
      nearbyObject: getNearbyObject(state),
      selectedObject: getObjectById(state.worldId, state.selectedObjectId),
      dispatch,
    };
  }, [state]);

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useWorld() {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used inside WorldProvider.');
  }

  return context;
}
