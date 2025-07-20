import React from 'react';
import { TStateKeyContext, TStateScopeContext } from './types.js';

export const StateScopeContext = React.createContext<TStateScopeContext>({
  scope: [],
  serializedScope: '',
});

export const StateKeyContext = React.createContext<TStateKeyContext>({
  keys: [],
  serializedKeys: '',
});

export const StateIdContext = React.createContext<string>('default');
