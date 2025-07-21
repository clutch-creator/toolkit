export type TStateScopeContext = {
  scope: string[];
  serializedScope: string;
};

export type TStateKeyContext = {
  keys: string[];
  serializedKeys: string;
};

export type TSelection = TStateScopeContext &
  TStateKeyContext & {
    instanceId: string;
  };

export type TActionData = {
  actionName: string;
  action: Function;
  styleSelectors?: { name: string; value: string }[];
  extraProps?: Record<string, any>;
  wrapperComponent?: React.FunctionComponent;
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
  select: { handler?: Function; activeTrail?: boolean };
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

  registerAction: (selection: TSelection, actionData: TActionData) => void;

  registerState: (selection: TSelection, name: string, value: unknown) => void;

  registerSelect: (
    selection: TSelection,
    handler: Function,
    activeTrail: boolean
  ) => void;

  unregisterInstance: (selection: TSelection) => void;

  setEventLoading: (
    selection: TSelection,
    eventName: string,
    isLoading: boolean
  ) => void;

  setEventActionResult: (
    selection: TSelection,
    eventName: string,
    actionName: string,
    result: unknown
  ) => void;
};
