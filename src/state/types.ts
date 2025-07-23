export type TStateScopeContext = {
  scope: string[];
  serializedScope: string;
};

export type TStateKeyContext = {
  keys: string[];
  serializedKeys: string;
};

export type TScopeSelection = TStateScopeContext &
  TStateKeyContext & {
    instanceId: string;
  };

export type TStyleSelector = {
  name: string;
  value: string;
};

export type TActionData = {
  name: string;
  action: (...args: unknown[]) => unknown;
  styleSelectors?: TStyleSelector[];
  props?: Record<string, unknown>;
  wrapper?: React.FunctionComponent;
};

export type TInstanceState = {
  actions?: Record<string, TActionData>;
  states?: Record<string, unknown>;
  actionsState?: {
    [eventName: string]: {
      isLoading?: boolean;
      [actionName: string]: unknown;
    };
  };
  select: {
    handler?: (shouldBeVisible: boolean) => void;
    activeTrail?: boolean;
  };
};

export type TStoreInstances = {
  [scope: string]: {
    [instanceId: string]: {
      [key: string]: TInstanceState;
    };
  };
};

export type TStore = {
  instances: TStoreInstances;

  styleSelectors: {
    [selectionId: string]: TStyleSelector[];
  };

  registerAction: (
    scopeSelection: TScopeSelection,
    actionData: TActionData
  ) => void;

  registerState: (
    scopeSelection: TScopeSelection,
    name: string,
    value: unknown
  ) => void;

  registerSelect: (
    scopeSelection: TScopeSelection,
    handler: (shouldBeVisible: boolean) => void,
    activeTrail: boolean
  ) => void;

  unregisterInstance: (scopeSelection: TScopeSelection) => void;

  setEventLoading: (
    scopeSelection: TScopeSelection,
    eventName: string,
    isLoading: boolean
  ) => void;

  setEventActionResult: (
    scopeSelection: TScopeSelection,
    eventName: string,
    actionName: string,
    result: unknown
  ) => void;

  updateInstanceStyleSelectors: (
    selectionId: string,
    styleSelectors: TStyleSelector[]
  ) => void;
};
