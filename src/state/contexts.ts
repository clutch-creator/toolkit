import React from 'react';
import { TStateKeyContext, TStateScopeContext } from './types.js';

export const StateScopeContext = React.createContext<TStateScopeContext>({
  scope: [],
  serializedScope: 'default',
});

export const StateKeyContext = React.createContext<TStateKeyContext>({
  keys: [],
  serializedKeys: 'default',
});

export const StateIdContext = React.createContext<string>('default');
