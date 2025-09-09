/* eslint-disable @typescript-eslint/no-unsafe-function-type */
'use client';

import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { cloneChildren, shallowEqual } from '../utils/helpers.js';
import { useEvent } from '../utils/hooks.js';
import {
  StateIdContext,
  StateKeyContext,
  StateScopeContext,
} from './contexts.js';
import { getSerializedScope } from './helpers.js';
import { closestInstanceSelector } from './selectors.js';
import { store, useStore } from './store.js';
import {
  MessageLevel,
  TActionData,
  TInstanceState,
  TScopeSelection,
} from './types.js';

export const useScopeSelection = () => {
  const scopeContext = useContext(StateScopeContext);
  const keyContext = useContext(StateKeyContext);
  const instanceId = useContext(StateIdContext);

  const selection = useMemo(() => {
    return {
      ...scopeContext,
      ...keyContext,
      instanceId,
    };
  }, [scopeContext, keyContext, instanceId]);

  return selection;
};

type TStyleSelector = {
  name: string;
  value: string;
};

type TRegisterActionOptions<T> = {
  name: string;
  action: T;
  props?:
    | Record<string, unknown>
    | ((...args: unknown[]) => Record<string, unknown>);
  wrapper?: React.FunctionComponent<{
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
  styleSelectors?: TStyleSelector[];
};

export const useRegisterAction = <T extends (...args: unknown[]) => unknown>(
  options: TRegisterActionOptions<T>
) => {
  const scopeSelection = useScopeSelection();
  const registerAction = useStore(state => state.registerAction);

  const { name = '', action } = options;

  // validation
  if (!name || !action) {
    throw new Error(
      'useRegisterAction: name and action are required parameters.'
    );
  }

  // stable function ref for action
  // this reduces burden of user having to memoize them
  const stableAction = useEvent((...args) => {
    action(...args);
  });

  const stablePropsFn = useEvent((...args) => {
    return typeof options.props === 'function' ? options.props(...args) : {};
  });

  useEffect(() => {
    registerAction(scopeSelection, {
      ...options,
      action: stableAction,
      props:
        typeof options.props === 'function' ? stablePropsFn : options.props,
    });
  }, [options, registerAction, scopeSelection, stableAction, stablePropsFn]);
};

export const useRegisterState = <T,>(
  name: string,
  value: T
): ((newValue: T) => void) => {
  const scopeSelection = useScopeSelection();
  const registerState = useStore(state => state.registerState);

  const setState = useCallback(
    (newValue: T) => {
      registerState(scopeSelection, name, newValue);
    },
    [name, scopeSelection, registerState]
  );

  useEffect(() => {
    setState(value);
  }, [setState, value]);

  return setState;
};

export const useRegisterSelect = (
  setVisibility: (shouldBeVisible: boolean) => void,
  activeTrail = true
) => {
  const scopeSelection = useScopeSelection();
  const registerSelect = useStore(state => state.registerSelect);

  useMemo(() => {
    registerSelect(scopeSelection, setVisibility, activeTrail);
  }, [scopeSelection, registerSelect, setVisibility, activeTrail]);

  return null;
};

const getScopeWithSelectionId = (
  scopeSelection: TScopeSelection,
  selectionId: string
): TScopeSelection => {
  // selection id will be root instances plus id root1#root2#id
  const rootInstances = selectionId.split('#');
  const instanceId = rootInstances.pop() || selectionId;
  const newScope = [...scopeSelection.scope, ...rootInstances];

  return {
    ...scopeSelection,
    scope: newScope,
    serializedScope: getSerializedScope(newScope),
    instanceId,
  };
};

export const useStateValue = <T,>(
  selectionId: string,
  sel: (instanceState: TInstanceState | undefined) => T
) => {
  const scopeSelection = useScopeSelection();
  const instanceScopeSelection = useMemo(
    () => getScopeWithSelectionId(scopeSelection, selectionId),
    [scopeSelection, selectionId]
  );

  return useStore(state =>
    sel(closestInstanceSelector(state, instanceScopeSelection))
  );
};

export const useActionState = (
  selectionId: string,
  actionName: string,
  actionPropArgsSel?: () => unknown[]
): TActionData | undefined => {
  const propsRef = useRef<{
    prevState: TInstanceState | undefined;
    prevProps: Record<string, unknown> | undefined;
    prevResult: TActionData | undefined;
  }>({
    prevState: undefined,
    prevProps: undefined,
    prevResult: undefined,
  });

  const actionState = useStateValue(selectionId, instanceState => {
    const instActionState = instanceState?.actions?.[actionName];

    if (typeof instActionState?.props === 'function') {
      const calculatedProps = instActionState.props(
        ...(actionPropArgsSel ? actionPropArgsSel() : [])
      );

      if (
        propsRef.current.prevState !== instanceState ||
        !shallowEqual(propsRef.current.prevProps, calculatedProps)
      ) {
        propsRef.current.prevState = instanceState;
        propsRef.current.prevProps = calculatedProps;
        propsRef.current.prevResult = {
          ...instActionState,
          props: instActionState.props(
            ...(actionPropArgsSel ? actionPropArgsSel() : [])
          ),
        };
      }

      return propsRef.current.prevResult;
    }

    return instActionState;
  });

  return actionState;
};

export const getStateValue = <T,>(
  scopeSelection: TScopeSelection,
  selectionId: string,
  sel: (instanceState: TInstanceState | undefined) => T
): T => {
  const instanceScopeSelection = getScopeWithSelectionId(
    scopeSelection,
    selectionId
  );
  const state = store.getState();

  return sel(closestInstanceSelector(state, instanceScopeSelection));
};

/**
 * Registers an instance that contains events, handles all logic around extra props, wrappers, etc
 */
export const useEventsInstance = (
  instanceId: string,
  {
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }
) => {
  const parenScopeSelection = useScopeSelection();
  const scopeSelection: TScopeSelection = useMemo(() => {
    return {
      ...parenScopeSelection,
      instanceId: instanceId,
    };
  }, [parenScopeSelection, instanceId]);

  const extraProps: Record<string, unknown> = {};
  const wrappers: React.FunctionComponent<{ children?: React.ReactNode }>[] =
    [];
  const styleSelectors: { name: string; value: string }[] = [];

  const setEventLoading = useStore(state => state.setEventLoading);
  const setEventActionResult = useStore(state => state.setEventActionResult);

  const setLoading = (eventName: string, isLoading: boolean) => {
    // This function would set the loading state for the action
    // It could be implemented using a state management solution or context
    setEventLoading(scopeSelection, eventName, isLoading);
  };

  // adds component actions used in the events in this instance
  const addActionState = (actionState: TActionData | undefined) => {
    if (actionState) {
      if (actionState.props && typeof actionState.props === 'object') {
        Object.assign(extraProps, actionState.props);
      }

      if (actionState?.wrapper) wrappers.push(actionState.wrapper);

      if (actionState?.styleSelectors)
        styleSelectors.push(...actionState.styleSelectors);
    }
  };

  const runAction = async (
    eventName: string,
    actionName: string,
    actionFn: () => Promise<unknown>
  ) => {
    let res;

    try {
      res = await actionFn();

      setEventActionResult(scopeSelection, eventName, actionName, res);
    } catch (error) {
      setEventActionResult(scopeSelection, eventName, actionName, {
        error: error?.toString(),
      });
      throw error;
    }

    // If the result is an object with an error property, throw an error
    // this prevents next actions from running
    if (
      res &&
      typeof res === 'object' &&
      'error' in res &&
      typeof res.error === 'string' &&
      res.error
    ) {
      throw new Error(res.error);
    }
  };

  const scopedGetStateValue = <T,>(
    selectionId: string,
    sel: (instanceState: TInstanceState | undefined) => T
  ): T => {
    return getStateValue(scopeSelection, selectionId, sel);
  };

  const render = (events: Record<string, Function>) => {
    let res = cloneChildren(children, {
      ...extraProps,
      ...props,
      ...events,
    });

    wrappers.forEach(Wrapper => {
      res = <Wrapper>{res}</Wrapper>;
    });

    return res;
  };

  const updateInstanceStyleSelectors = useStore(
    state => state.updateInstanceStyleSelectors
  );
  const selectionId = useMemo(() => {
    return [...scopeSelection.scope, scopeSelection.instanceId].join('#');
  }, [scopeSelection]);

  updateInstanceStyleSelectors(selectionId, styleSelectors);

  return {
    addActionState,
    getStateValue: scopedGetStateValue,
    runAction,
    setLoading,
    render,
  };
};

/**
 * Hook to set a warning message for current instance
 *
 * @param shouldWarn true if should show a warning
 * @param warnMessage message to show
 */
export const useWarn = (shouldWarn: boolean, warnMessage: string) => {
  const scopeSelection = useScopeSelection();
  const setInstanceMessage = useStore(state => state.setInstanceMessage);

  useEffect(() => {
    setInstanceMessage(
      scopeSelection,
      MessageLevel.WARN,
      shouldWarn,
      warnMessage
    );
  }, [shouldWarn, warnMessage, setInstanceMessage, scopeSelection]);
};
