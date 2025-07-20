import React from 'react';

/**
 * Configuration function for Clutch Elements
 *
 * @param element The React Component to be used in Clutch
 * @param config Additional information about the component
 */
export const clutchElementConfig = (
  element: React.FunctionComponent,
  config: {
    icon?: string;
    styleSelectors?: { name?: string; value: string }[];
  }
) => undefined;

export * from './helpers';
export * from './state';
