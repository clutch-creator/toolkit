declare global {
  interface Window {
    CLUTCH_DEBUG?: boolean;
  }
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isServer = typeof window === 'undefined';

const isClutchDebugging = () => {
  return typeof window !== 'undefined' && window.CLUTCH_DEBUG;
};

export const logger = {
  log(...args: unknown[]) {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log('[CLUTCH_CONTEXT]', ...args);
    }
  },
  // clutch debugging
  debug(...args: unknown[]) {
    if (isClutchDebugging()) {
      // eslint-disable-next-line no-console
      console.log('[CLUTCH_CONTEXT]', ...args);
    }
  },
  warn(...args: unknown[]) {
    if (isDevelopment || isServer) {
      // eslint-disable-next-line no-console
      console.warn('[CLUTCH_CONTEXT]', ...args);
    }
  },
  error(...args: unknown[]) {
    if (isDevelopment || isServer) {
      // eslint-disable-next-line no-console
      console.error('[CLUTCH_CONTEXT]', ...args);
    }
  },
};
