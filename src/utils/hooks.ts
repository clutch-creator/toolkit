'use client';

import { useCallback, useRef } from 'react';

/**
 * A React hook that creates a stable callback reference that always calls the latest version
 * of the provided callback. Useful for avoiding unnecessary re-renders when passing callbacks
 * to child components while ensuring the callback always has access to the latest closure values.
 */
export function useEvent<TArgs extends unknown[], TRet>(
  callback: (...args: TArgs) => TRet
): (...args: TArgs) => TRet {
  const ref = useRef(callback);

  ref.current = callback;

  return useCallback((...args: TArgs): TRet => ref.current(...args), []);
}
