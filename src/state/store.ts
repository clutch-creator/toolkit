import { create } from "zustand";

type TActionsMap = { [instanceId: string]: Map<string, Function> };
type TStatesMap = {
  [instanceId: string]: { [name: string]: string | boolean | number };
};
type TStateMap = { [instanceId: string]: unknown };

export type TClutchStore = {
  actions: TActionsMap;
  actionsState: TStateMap;
  states?: TStatesMap;
  onSelect?: Function;
  onSelectActiveTrail?: boolean;
  // Actions
  registerAction: (
    instanceId: string,
    actionName: string,
    action: Function,
    props?: Record<string, unknown>,
    styleSelectors?: { id: string; value: string; selector: string }[],
    wrapperComponent?: React.FunctionComponent,
  ) => void;
  unregisterAction: (instanceId: string, actionName: string) => void;
  setActionsState: (instanceId: string, state: unknown) => void;
  registerState?: <T>(instanceId: string, name: string, value: T) => void;
  unregisterState?: (instanceId: string, name: string) => void;
  getAction?: (instanceId: string, actionName: string) => Function;
  setOnSelect: (onSelect: Function) => void;
  setOnSelectActiveTrail: (ignoreTrail: boolean) => void;
};

export const storeFactory = (set): TClutchStore => ({
  actions: {},
  actionsState: {},
  states: {},
  onSelect: undefined,
  registerAction: (
    instanceId,
    actionName,
    action,
    extraProps,
    styleSelectors,
    wrapperComponent,
  ) => {
    set((state) => {
      if (
        !actionName ||
        !action ||
        (state.actions[instanceId]?.has(actionName) &&
          state.actions[instanceId].get(actionName) === action)
      )
        return state;

      const targetMap = new Map(state.actions[instanceId]);

      if (window.CLUTCH_DEBUG)
        console.log(
          "[CLUTCH_CONTEXT] Registered Action",
          instanceId,
          actionName,
          action,
        );

      targetMap.set(actionName, {
        action,
        extraProps,
        styleSelectors,
        wrapperComponent,
      });

      return {
        ...state,
        actions: {
          ...state.actions,
          [instanceId]: targetMap,
        },
      };
    });
  },
  unregisterAction: (instanceId, actionName) => {
    set((state) => {
      if (!actionName || !state.actions[instanceId]?.has(actionName))
        return state;

      const targetMap: Map<string, Function> = new Map(
        state.actions[instanceId],
      );

      if (window.CLUTCH_DEBUG)
        console.log("[CLUTCH_CONTEXT] Removed Action", instanceId, actionName);

      const result = {
        ...state,
        actions: {
          ...state.actions,
          [instanceId]: targetMap,
        },
      };

      targetMap.delete(actionName);

      if (targetMap.size === 0) {
        delete result.actions[instanceId];
      }

      return result;
    });
  },
  setActionsState: (instanceId, state) => {
    set((prevState) => {
      if (prevState.actionsState[instanceId] === state) return state;

      if (window.CLUTCH_DEBUG)
        console.log("[CLUTCH_CONTEXT] Set Action State", instanceId, state);

      const newState = { ...prevState.actionsState, [instanceId]: state };

      if (state === undefined) {
        delete newState[instanceId];
      }

      return {
        ...prevState,
        actionsState: newState,
      };
    });
  },
  registerState: (instanceId, name, value) => {
    set((state) => {
      if (
        !name ||
        (state.states[instanceId] &&
          name in state.states[instanceId] &&
          state.states[instanceId][name] === value)
      )
        return state;

      if (window.CLUTCH_DEBUG)
        console.log(
          "[CLUTCH_CONTEXT] Registered State",
          instanceId,
          name,
          value,
        );

      return {
        ...state,
        states: {
          ...state.states,
          [instanceId]: {
            ...(state.states[instanceId] || {}),
            [name]: value,
          },
        },
      };
    });
  },
  unregisterState: (instanceId, name) => {
    set((state) => {
      if (!state.states[instanceId] || !(name in state.states[instanceId]))
        return state;

      if (window.CLUTCH_DEBUG)
        console.log("[CLUTCH_CONTEXT] Removed State", instanceId, name);

      const result = {
        ...state,
        states: {
          ...state.states,
          [instanceId]: { ...state.states[instanceId] },
        },
      };

      delete result.states[instanceId][name];

      if (Object.keys(result.states[instanceId]).length === 0) {
        delete result.states[instanceId];
      }

      return result;
    });
  },
  setOnSelect: (onSelect) => {
    set((state) => {
      if (state.onSelect === onSelect) return state;

      return {
        ...state,
        onSelect,
      };
    });
  },
  setOnSelectActiveTrail: (activeTrail) => {
    set((state) => {
      if (state.onSelectActiveTrail === activeTrail) return state;

      return {
        ...state,
        onSelectActiveTrail: activeTrail,
      };
    });
  },
});

export const useClutchStore = create<TClutchStore>((set) => storeFactory(set));
