import { getSerializedKeys } from './helpers.js';
import { TInstanceState, TSelection, TStore } from './types.js';

export const instanceSelector = (
  state: TStore,
  selection: TSelection
): TInstanceState | undefined => {
  const { serializedScope, serializedKeys, instanceId } = selection;

  return state.instances[serializedScope]?.[instanceId]?.[serializedKeys];
};

export const closestInstanceSelector = (
  state: TStore,
  selection: TSelection,
  instanceId: string
): TInstanceState | undefined => {
  const { serializedScope, serializedKeys, keys } = selection;

  const instancesState = state.instances[serializedScope]?.[instanceId];

  if (!instancesState) return undefined;

  // try exact match first
  if (instancesState?.[serializedKeys]) {
    return instancesState[serializedKeys];
  }

  // if not found, try to find the closest match by iteratively removing last key
  const currentKeys = [...keys];

  while (currentKeys.length > 0) {
    currentKeys.pop(); // remove last item
    const serializedKey = getSerializedKeys(currentKeys);

    if (instancesState?.[serializedKey]) {
      return instancesState[serializedKey];
    }
  }

  return undefined;
};
