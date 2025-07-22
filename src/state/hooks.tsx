/* eslint-disable @typescript-eslint/no-unsafe-function-type */
'use client';

import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { cloneChildren, shallowEqual } from '../utils/helpers.js';
import {
  StateIdContext,
  StateKeyContext,
  StateScopeContext,
} from './contexts.js';
import { getSerializedScope } from './helpers.js';
import { closestInstanceSelector } from './selectors.js';
import { useStore } from './store.js';
import { TActionData, TInstanceState, TScopeSelection } from './types.js';

const useScopeSelection = () => {
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
  actionName?: string;
  action: T;
  extraProps?: Record<string, unknown>;
  styleSelectors?: TStyleSelector[];
  wrapperComponent?: React.FunctionComponent<{
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
};

export const useRegisterAction = <T extends (...args: unknown[]) => unknown>(
  options: TRegisterActionOptions<T>
) => {
  const scopeSelection = useScopeSelection();
  const registerAction = useStore(state => state.registerAction);

  const {
    actionName = '',
    action,
    extraProps,
    styleSelectors,
    wrapperComponent,
  } = options;

  // validation
  if (!actionName || !action) {
    throw new Error(
      'useRegisterAction: actionName and action are required parameters.'
    );
  }

  // some options are not meant to be listened to changes
  // this reduces burden of user having to memoize them
  const staticOptions = useRef<TRegisterActionOptions<T>>({
    action,
    styleSelectors,
  });

  // update static options if needed
  useMemo(() => {
    staticOptions.current.action = action;
    staticOptions.current.styleSelectors = styleSelectors;
  }, [action, styleSelectors]);

  // update listenable options
  const prevOptionsRef = useRef<TRegisterActionOptions<T> | null>(null);

  useMemo(() => {
    const prev = prevOptionsRef.current;
    const hasChanged =
      !prev ||
      prev.actionName !== actionName ||
      prev.wrapperComponent !== wrapperComponent ||
      !shallowEqual(prev.extraProps, extraProps);

    if (hasChanged) {
      registerAction(scopeSelection, {
        actionName,
        extraProps,
        wrapperComponent,
        action: staticOptions.current.action,
        styleSelectors: staticOptions.current.styleSelectors,
      });
    }
  }, [
    actionName,
    wrapperComponent,
    extraProps,
    registerAction,
    scopeSelection,
  ]);

  prevOptionsRef.current = options;
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

export const useStateValue = <T,>(
  selectionId: string,
  sel: (instanceState: TInstanceState | undefined) => T
) => {
  const scopeSelection = useScopeSelection();

  const instanceScopeSelection = useMemo(() => {
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
  }, [scopeSelection, selectionId]);

  return useStore(state =>
    sel(closestInstanceSelector(state, instanceScopeSelection))
  );
};

export const useActionState = (
  selectionId: string,
  actionName: string
): TActionData | undefined => {
  return useStateValue(
    selectionId,
    instanceState => instanceState?.actions?.[actionName]
  );
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
      Object.assign(extraProps, actionState.extraProps);

      if (actionState?.wrapperComponent)
        wrappers.push(actionState.wrapperComponent);

      if (actionState?.styleSelectors)
        styleSelectors.push(...actionState.styleSelectors);
    }
  };

  const runAction = async (
    eventName: string,
    actionName: string,
    actionFn: () => Promise<unknown>
  ) => {
    try {
      const res = await actionFn();

      setEventActionResult(scopeSelection, eventName, actionName, res);
    } catch (error) {
      setEventActionResult(scopeSelection, eventName, actionName, {
        error: error?.toString(),
      });
      throw error;
    }
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

  return {
    addActionState,
    runAction,
    setLoading,
    render,
  };
};
