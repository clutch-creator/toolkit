import { TInstanceState, TSelection, TStore } from './types.js';

export const instanceSelector = (
  state: TStore,
  selection: TSelection
): TInstanceState | undefined => {
  const { serializedScope, serializedKeys, instanceId } = selection;

  return state.instances[serializedScope]?.[instanceId]?.[serializedKeys];
};
