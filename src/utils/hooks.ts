'use client';

import { useCallback, useRef } from 'react';

type AnyFunction = (...args: any[]) => any;

/**
 * A React hook that creates a stable callback reference that always calls the latest version
 * of the provided callback. Useful for avoiding unnecessary re-renders when passing callbacks
 * to child components while ensuring the callback always has access to the latest closure values.
 */
export const useEvent = <TCallback extends AnyFunction>(
  callback: TCallback
): TCallback => {
  const ref = useRef<TCallback>(callback);

  ref.current = callback;

  return useCallback((...args: Parameters<TCallback>) => {
    return ref.current(...args);
  }, []) as TCallback;
};
