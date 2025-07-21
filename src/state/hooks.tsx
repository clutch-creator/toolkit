'use client';

import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { cloneChildren, shallowEqual } from '../helpers/utils.js';
import {
  StateIdContext,
  StateKeyContext,
  StateScopeContext,
} from './contexts.js';
import { useStore } from './store.js';

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
        static: staticOptions.current,
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

type TPropertyPath = (string | number)[];

export const useStateValue = (instanceId, sel: TPropertyPath) => {
  const selection = useSelection();
  const value = useStore(state =>
    getInstanceState(state, serializedScope, keys, propertyPath)
  );

  return value;
};

export const useActionState = (instanceId, actionName: string) => {
  const selection = useSelection();
  const actionState = useStore(state =>
    instanceActionSelector(state, selection, actionName)
  );
};

/**
 * Registers an instance that contains events, handles all logic around extra props, wrappers, etc
 */
export const useEventsInstance = (id, { children, ...props }) => {
  const parentSelection = useSelection();
  const selection = useMemo(() => {
    return {
      ...parentSelection,
      instanceId: id,
    };
  }, [parentSelection, id]);
  const ref = useRef({
    extraProps: {},
    wrappers: [],
    styleSelectors: [],
    props,
  });

  ref.current.extraProps = {};
  ref.current.wrappers = [];
  ref.current.styleSelectors = [];
  ref.current.props = props;

  // adds component actions used in the events in this instance
  const addActionState = useCallback(
    actionState => {
      Object.assign(ref.current.extraProps, actionState.extraProps);

      if (actionState?.wrapperComponent)
        ref.current.wrappers.push(actionState.wrapperComponent);

      if (actionState?.styleSelectors)
        ref.current.styleSelectors.push(...actionState.styleSelectors);
    },
    [ref]
  );

  const runAction = useCallback(
    (actionName, actionFn) => {
      // 1. set event action to loading
      // 2. run the action function with error handling
      // 3. set event action to success or error based on the result
    },
    [selection]
  );

  const render = useCallback(
    events => {
      const { wrappers, extraProps, props } = ref.current;

      let res = cloneChildren(children, {
        ...extraProps,
        ...props,
        ...events,
      });

      wrappers.forEach(Wrapper => {
        res = <Wrapper>{res}</Wrapper>;
      });

      return res;
    },
    [children, ref]
  );

  return {
    addActionState,
    render,
  };
};
