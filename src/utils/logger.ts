declare global {
  interface Window {
    CLUTCH_DEBUG?: boolean;
  }
}

const isDebugging = () => {
  return typeof window !== 'undefined' && window.CLUTCH_DEBUG;
};

export const logger = {
  log(...args: unknown[]) {
    if (isDebugging()) {
      // eslint-disable-next-line no-console
      console.log('[CLUTCH_CONTEXT]', ...args);
    }
  },
  warn(...args: unknown[]) {
    if (isDebugging()) {
      // eslint-disable-next-line no-console
      console.warn('[CLUTCH_CONTEXT]', ...args);
    }
  },
  error(...args: unknown[]) {
    if (isDebugging()) {
      // eslint-disable-next-line no-console
      console.error('[CLUTCH_CONTEXT]', ...args);
    }
  },
};
