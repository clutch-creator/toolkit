// Test environment setup for Bun
import { beforeAll } from 'bun:test';
import { JSDOM } from 'jsdom';

// Set up JSDOM environment for React testing
beforeAll(() => {
  // Configure JSDOM for React testing
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  });

  // Set up globals
  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;

  // Mock console methods for cleaner test output
  globalThis.console.warn = () => {};
});
