'use client';

import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { cloneChildren, shallowEqual } from '../utils/helpers.js';
import {
  StateIdContext,
  StateKeyContext,
  StateScopeContext,
} from './contexts.js';
import { closestInstanceSelector } from './selectors.js';
import { useStore } from './store.js';
import { TActionData, TInstanceState } from './types.js';

const useSelection = () => {
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
  extraProps?: Record<string, any>;
  styleSelectors?: TStyleSelector[];
  wrapperComponent?: React.FunctionComponent<{
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
};

export const useRegisterAction = <T extends Function>(
  options: TRegisterActionOptions<T>
) => {
  const selection = useSelection();
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
    console.warn(
      'useRegisterAction: actionName and action are required parameters.'
    );
    return;
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
      registerAction(selection, {
        actionName,
        extraProps,
        wrapperComponent,
        action: staticOptions.current.action,
        styleSelectors: staticOptions.current.styleSelectors,
      });
    }

    prevOptionsRef.current = options;
  }, [selection, actionName, wrapperComponent, extraProps, staticOptions]);
};

export const useRegisterState = <T,>(
  name: string,
  value: T
): ((newValue: T) => void) => {
  const selection = useSelection();
  const registerState = useStore(state => state.registerState);

  const setState = useCallback(
    (newValue: T) => {
      registerState(selection, name, newValue);
    },
    [name, selection, registerState]
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
  const selection = useSelection();
  const registerSelect = useStore(state => state.registerSelect);

  useMemo(() => {
    registerSelect(selection, setVisibility, activeTrail);
  }, [selection, registerSelect, setVisibility, activeTrail]);

  return null;
};

export const useStateValue = (
  instanceId: string,
  sel: (instanceState: TInstanceState | undefined) => unknown
) => {
  const selection = useSelection();

  return useStore(state =>
    sel(closestInstanceSelector(state, selection, instanceId))
  );
};

export const useActionState = (
  instanceId: string,
  actionName: string
): TActionData | undefined => {
  const selection = useSelection();

  return useStore(
    state =>
      closestInstanceSelector(state, selection, instanceId)?.actions?.[
        actionName
      ]
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
  const parentSelection = useSelection();
  const selection = useMemo(() => {
    return {
      ...parentSelection,
      instanceId: instanceId,
    };
  }, [parentSelection, instanceId]);

  const extraProps: Record<string, unknown> = {};
  const wrappers: React.FunctionComponent[] = [];
  const styleSelectors: { name: string; value: string }[] = [];

  const setEventLoading = useStore(state => state.setEventLoading);
  const setEventActionResult = useStore(state => state.setEventActionResult);

  const setLoading = (eventName: string, isLoading: boolean) => {
    // This function would set the loading state for the action
    // It could be implemented using a state management solution or context
    setEventLoading(selection, eventName, isLoading);
  };

  // adds component actions used in the events in this instance
  const addActionState = (actionState: TActionData) => {
    Object.assign(extraProps, actionState.extraProps);

    if (actionState?.wrapperComponent)
      wrappers.push(actionState.wrapperComponent);

    if (actionState?.styleSelectors)
      styleSelectors.push(...actionState.styleSelectors);
  };

  const runAction = async (
    eventName: string,
    actionName: string,
    actionFn: () => Promise<unknown>
  ) => {
    try {
      const res = await actionFn();

      setEventActionResult(selection, eventName, actionName, res);
    } catch (error) {
      setEventActionResult(selection, eventName, actionName, {
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
