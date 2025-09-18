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
  props?:
    | Record<string, unknown>
    | ((...args: unknown[]) => Record<string, unknown>);
  wrapper?: React.FunctionComponent;
};

export enum MessageLevel {
  WARN = 'warn',
  ERROR = 'error',
}

export type TInstanceState = {
  actions?: Record<string, TActionData>;
  states?: Record<string, unknown>;
  messages?: {
    warn?: Set<string>;
    error?: Set<string>;
  };
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

  scopedStyleSelectors: {
    [selectionId: string]: {
      [scope: string]: TStyleSelector[];
    };
  };
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

  setInstanceMessage: (
    scopeSelection: TScopeSelection,
    level: MessageLevel,
    shouldShow: boolean,
    message: string
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
    styleSelectors: TStyleSelector[],
    scope?: string
  ) => void;
};
