import { create } from 'zustand';
import { shallowEqual } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { instanceSelector } from './selectors.js';
import {
  TInstanceState,
  TScopeSelection,
  TStore,
  TStoreInstances,
} from './types.js';

const operateInstance = (
  instances: TStoreInstances,
  scopeSelection: TScopeSelection,
  instance: TInstanceState
): TStoreInstances => {
  const { instanceId, serializedScope, serializedKeys } = scopeSelection;

  return {
    ...instances,
    [serializedScope]: {
      ...instances[serializedScope],
      [instanceId]: {
        ...instances[serializedScope]?.[instanceId],
        [serializedKeys]: instance,
      },
    },
  };
};

const getInstance = (
  state: TStore,
  scopeSelection: TScopeSelection
): TInstanceState => {
  const instance = instanceSelector(state, scopeSelection);

  if (!instance) {
    return {
      actions: {},
      states: {},
      select: {},
    };
  }

  return instance;
};

export const useStore = create<TStore>((set, get) => ({
  instances: {},

  styleSelectors: {},

  registerAction: (scopeSelection, options) => {
    const { name, wrapper, action } = options;

    const instance = getInstance(get(), scopeSelection);
    const existingActionOptions = instance?.actions?.[name];

    if (
      !instance ||
      !existingActionOptions ||
      existingActionOptions.wrapper !== wrapper ||
      !shallowEqual(
        typeof existingActionOptions.props !== 'function'
          ? existingActionOptions.props
          : {},
        typeof options.props !== 'function' ? options.props : {}
      ) ||
      existingActionOptions.action !== action
    ) {
      set(state => {
        const newInstances = operateInstance(state.instances, scopeSelection, {
          ...instance,
          actions: {
            ...instance.actions,
            [name]: options,
          },
        });

        return { instances: newInstances };
      });
    } else {
      // mutate styleSelectors directly since they are used for introspection only
      existingActionOptions.styleSelectors = options.styleSelectors;
    }
  },

  registerState: (scopeSelection, name, value) => {
    set(state => {
      logger.debug('Registered State', scopeSelection, name, value);

      const instance = getInstance(state, scopeSelection);

      const newInstances = operateInstance(state.instances, scopeSelection, {
        ...instance,
        states: {
          ...instance.states,
          [name]: value,
        },
      });

      return { instances: newInstances };
    });
  },

  registerSelect: (scopeSelection, handler, activeTrail) => {
    // select dont need to update store state
    const instance = instanceSelector(get(), scopeSelection);

    if (!instance) {
      set(state => {
        const newInstances = operateInstance(state.instances, scopeSelection, {
          actions: {},
          states: {},
          select: {
            handler,
            activeTrail,
          },
        });

        return { instances: newInstances };
      });
    } else {
      instance.select = instance.select || {};
      instance.select.handler = handler;
      instance.select.activeTrail = activeTrail;
    }
  },

  unregisterInstance: scopeSelection => {
    set(state => {
      logger.debug('Unregistered Instance', scopeSelection);

      const instance = instanceSelector(state, scopeSelection);

      if (!instance) {
        logger.debug(`No instance found`, scopeSelection);

        return state;
      }

      const { instances } = state;
      const { instanceId, serializedScope, serializedKeys } = scopeSelection;

      const newInstances = {
        ...instances,
        [serializedScope]: {
          ...instances[serializedScope],
          [instanceId]: {
            ...instances[serializedScope]?.[instanceId],
          },
        },
      };

      delete newInstances[serializedScope]?.[instanceId]?.[serializedKeys];

      if (
        Object.keys(newInstances[serializedScope]?.[instanceId] || {})
          .length === 0
      ) {
        delete newInstances[serializedScope]?.[instanceId];
      }

      return { instances: newInstances };
    });
  },

  setEventLoading: (
    scopeSelection: TScopeSelection,
    eventName: string,
    isLoading: boolean
  ) => {
    set(state => {
      const instance = getInstance(state, scopeSelection);

      const newInstances = operateInstance(state.instances, scopeSelection, {
        ...instance,
        actionsState: {
          ...instance.actionsState,
          [eventName]: {
            ...instance.actionsState?.[eventName],
            isLoading,
          },
        },
      });

      return { instances: newInstances };
    });
  },

  setEventActionResult: (
    scopeSelection: TScopeSelection,
    eventName: string,
    actionName: string,
    result: unknown
  ) => {
    set(state => {
      const instance = getInstance(state, scopeSelection);

      const newInstances = operateInstance(state.instances, scopeSelection, {
        ...instance,
        actionsState: {
          ...instance.actionsState,
          [eventName]: {
            ...instance.actionsState?.[eventName],
            [actionName]: result,
          },
        },
      });

      return { instances: newInstances };
    });
  },

  updateInstanceStyleSelectors: (
    selectionId: string,
    styleSelectors: { name: string; value: string }[]
  ) => {
    // we dont need to update the store, mutate styleSelectors directly (debugging only)
    const state = get();

    state.styleSelectors[selectionId] = styleSelectors;
  },
}));

export const store = useStore;

export type TStateStore = typeof store;
