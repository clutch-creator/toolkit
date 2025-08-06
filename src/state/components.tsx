'use client';

import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { cloneChildren } from '../utils/helpers.js';
import {
  StateIdContext,
  StateKeyContext,
  StateScopeContext,
} from './contexts.js';
import { getSerializedKeys, getSerializedScope } from './helpers.js';
import { useScopeSelection } from './hooks.js';
import { useStore } from './store.js';
import { TScopeSelection } from './types.js';

type TStateScopeProps = {
  children: React.ReactNode;
  clutchId: string;
  [key: string]: unknown;
};

/**
 * StateScope component is used to create a new scope for state management.
 * It allows components to be grouped together and share state within that scope.
 */
export const StateScope = ({
  children,
  clutchId,
  ...props
}: TStateScopeProps) => {
  const { scope } = useContext(StateScopeContext);
  const newValue = useMemo(
    () => ({
      scope: [...scope, clutchId],
      serializedScope: getSerializedScope([...scope, clutchId]),
    }),
    [scope, clutchId]
  );

  const clonedChildren = cloneChildren(children, props);

  return (
    <StateScopeContext.Provider value={newValue}>
      {clonedChildren}
    </StateScopeContext.Provider>
  );
};

type TStateExitScopeProps = {
  children: React.ReactNode;
  [key: string]: unknown;
};

/**
 * StateExitScope component is used to exit the current scope
 * and return to the previous scope.
 */
export const StateExitScope = ({
  children,
  ...props
}: TStateExitScopeProps) => {
  const { scope } = useContext(StateScopeContext);
  const newValue = useMemo(
    () => ({
      scope: scope.slice(0, -1),
      serializedScope: getSerializedScope(scope.slice(0, -1)),
    }),
    [scope]
  );

  const clonedChildren = cloneChildren(children, props);

  return (
    <StateScopeContext.Provider value={newValue}>
      {clonedChildren}
    </StateScopeContext.Provider>
  );
};

/**
 * StateKeysContext is used to passed down a reference that contains all instances rendered by stateKey
 */
const StateKeysContext = React.createContext<Record<string, Set<object>>>({});

export const StateKeysProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const ref = useRef({});

  return (
    <StateKeysContext.Provider value={ref.current}>
      {children}
    </StateKeysContext.Provider>
  );
};

type TStateKeyProps = {
  children: React.ReactNode;
  clutchId: string;
  [key: string]: unknown;
};

/**
 * StateKey component is used to create a unique key for each instance of a component
 * within a specific scope. It helps in managing state and actions for components
 * that may be rendered multiple times within the same scope.
 * It also ensures that the state is correctly scoped and does not conflict with other instances.
 */
export const StateKey = ({ children, clutchId, ...props }: TStateKeyProps) => {
  // clutch inspection is expecting this context in this position
  const { serializedScope } = useContext(StateScopeContext);
  const activeInstances = useContext(StateKeysContext);
  const { keys, serializedKeys } = useContext(StateKeyContext);

  const scopedId = `${serializedScope}#${serializedKeys}#${clutchId}`;

  // Create a stable ref for this component instance
  const instanceRef = useRef({});

  // Generate a stable keyId based on the instance's position in the set
  // clutch inspection is expecting this memo to be the second memoized state in fiber
  const keyId = useMemo(() => {
    if (!activeInstances[scopedId]) {
      activeInstances[scopedId] = new Set();
    }

    const instances = activeInstances[scopedId];

    instances.add(instanceRef.current);

    // Convert set to array to get consistent ordering
    const instanceArray = Array.from(instances);
    const index = instanceArray.indexOf(instanceRef.current);

    return `${index + 1}`;
  }, [activeInstances, scopedId]);

  // Determine if this is a loop (more than one instance)
  const isLoop = useMemo(() => {
    const instances = activeInstances[scopedId];

    return instances ? instances.size > 1 : false;
  }, [activeInstances, scopedId]);

  // Clean up on unmount
  useEffect(() => {
    const currentInstanceRef = instanceRef.current;

    return () => {
      const instances = activeInstances[scopedId];

      if (instances) {
        instances.delete(currentInstanceRef);
        if (instances.size === 0) {
          delete activeInstances[scopedId];
        }
      }
    };
  }, [activeInstances, scopedId]);

  const newKeyContextValue = useMemo(() => {
    const newKeys = [...keys, keyId];

    return {
      keys: newKeys,
      serializedKeys: getSerializedKeys(newKeys),
    };
  }, [keys, keyId]);

  const clonedChildren = cloneChildren(children, props);

  if (isLoop) {
    return (
      <StateKeyContext.Provider value={newKeyContextValue}>
        {clonedChildren}
      </StateKeyContext.Provider>
    );
  }

  return clonedChildren;
};

StateKey.displayName = 'StateKey';

type TStateIdProps = {
  children: React.ReactNode;
  clutchId: string;
  [key: string]: unknown;
};

/**
 * StateId component is used to provide the state identification context to its children.
 * It reduces the api burden when registering states and actions by identifying the id beforehand.
 */
export const StateId = ({ children, clutchId, ...props }: TStateIdProps) => {
  const inheritedScopeSelection = useScopeSelection();
  const scopeSelection: TScopeSelection = useMemo(() => {
    return {
      ...inheritedScopeSelection,
      instanceId: clutchId,
    };
  }, [inheritedScopeSelection, clutchId]);
  const unregisterInstance = useStore(state => state.unregisterInstance);

  const clonedChildren = cloneChildren(children, props);
  const ref = useRef(scopeSelection);

  ref.current = scopeSelection;

  useEffect(() => () => unregisterInstance(ref.current), [unregisterInstance]);

  return (
    <StateIdContext.Provider value={clutchId}>
      {clonedChildren}
    </StateIdContext.Provider>
  );
};
