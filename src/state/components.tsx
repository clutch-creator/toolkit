'use client';

import React, { useContext, useEffect, useMemo } from 'react';
import { cloneChildren } from '../helpers/utils.js';
import {
  StateIdContext,
  StateKeyContext,
  StateScopeContext,
} from './contexts.js';

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
      serializedScope: [...scope, clutchId].join('#'),
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
      serializedScope: scope.slice(0, -1).join('#'),
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

type TStateKeyProps = {
  children: React.ReactNode;
  clutchId: string;
  [key: string]: unknown;
};

const instanceCounts = new Map<string, number>();
let uniqueIdCounter = 0;

/**
 * StateKey component is used to create a unique key for each instance of a component
 * within a specific scope. It helps in managing state and actions for components
 * that may be rendered multiple times within the same scope.
 * It also ensures that the state is correctly scoped and does not conflict with other instances.
 */
export const StateKey = ({ children, clutchId, ...props }: TStateKeyProps) => {
  const { serializedScope } = useContext(StateScopeContext);
  const { keys } = useContext(StateKeyContext);

  const keyId = useMemo(() => {
    uniqueIdCounter += 1;

    return `${uniqueIdCounter}`;
  }, []);

  const scopedId = useMemo(() => {
    return serializedScope ? `${serializedScope}#${clutchId}` : clutchId;
  }, [serializedScope, clutchId]);

  // incremente the instance count
  const isLoop = useMemo(() => {
    const currentCount = instanceCounts.get(scopedId) || 0;
    const newCount = currentCount + 1;

    instanceCounts.set(scopedId, newCount);

    return newCount > 1;
  }, [scopedId]);

  // decrement the instance count
  useEffect(() => {
    return () => {
      const currentCount = instanceCounts.get(scopedId) || 0;

      if (currentCount > 1) {
        instanceCounts.set(scopedId, currentCount - 1);
      } else {
        instanceCounts.delete(scopedId);
      }
    };
  }, [scopedId]);

  const newKeyContextValue = useMemo(() => {
    const newKeys = [...keys, keyId];

    return {
      keys: newKeys,
      serializedKeys: newKeys.join('#'),
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
  const clonedChildren = cloneChildren(children, props);

  return (
    <StateIdContext.Provider value={clutchId}>
      {clonedChildren}
    </StateIdContext.Provider>
  );
};
