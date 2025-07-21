import { create } from 'zustand';
import { logger } from '../utils/logger.js';
import { instanceSelector } from './selectors.js';
import {
  TInstanceState,
  TSelection,
  TStore,
  TStoreInstances,
} from './types.js';

const operateInstance = (
  instances: TStoreInstances,
  selection: TSelection,
  instance: TInstanceState
): TStoreInstances => {
  const { instanceId, serializedScope, serializedKeys } = selection;

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

const getInstance = (state: TStore, selection: TSelection): TInstanceState => {
  const instance = instanceSelector(state, selection);

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

  registerAction: (selection, options) => {
    const { actionName } = options;

    set(state => {
      logger.log('Registered Action', selection, options);

      const instance = getInstance(state, selection);

      const newInstances = operateInstance(state.instances, selection, {
        ...instance,
        actions: {
          ...instance.actions,
          [actionName]: options,
        },
      });

      return { instances: newInstances };
    });
  },

  registerState: (selection, name, value) => {
    set(state => {
      logger.log('Registered State', selection, name, value);

      const instance = getInstance(state, selection);

      const newInstances = operateInstance(state.instances, selection, {
        ...instance,
        states: {
          ...instance.states,
          [name]: value,
        },
      });

      return { instances: newInstances };
    });
  },

  registerSelect: (selection, handler, activeTrail) => {
    // select dont need to update store state
    const instance = instanceSelector(get(), selection);

    if (!instance) {
      set(state => {
        const newInstances = operateInstance(state.instances, selection, {
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
      instance.select.handler = handler;
      instance.select.activeTrail = activeTrail;
    }
  },

  unregisterInstance: selection => {
    set(state => {
      logger.log('Unregistered Instance', selection);

      const instance = instanceSelector(state, selection);

      if (!instance) {
        logger.warn(`No instance found`, selection);
        return state;
      }

      const instances = state.instances;
      const { instanceId, serializedScope, serializedKeys } = selection;

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
    selection: TSelection,
    eventName: string,
    isLoading: boolean
  ) => {
    set(state => {
      const instance = getInstance(state, selection);

      const newInstances = operateInstance(state.instances, selection, {
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
    selection: TSelection,
    eventName: string,
    actionName: string,
    result: unknown
  ) => {
    set(state => {
      const instance = getInstance(state, selection);

      const newInstances = operateInstance(state.instances, selection, {
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
}));
