import * as qs from 'qs-esm';
import React from 'react';
import { logger } from './logger.js';

/**
 * Configuration function for Clutch Elements
 *
 * @param element - The React Component to be used in Clutch
 * @param config - Additional information about the component
 * @param config.icon - Optional icon identifier for the component
 * @param config.styleSelectors - Optional array of style selectors with name-value pairs
 * @returns void - This function only logs debug information
 *
 * @deprecated This is deprecated and will be removed in future versions.
 * Icon is now file convention and style selectors is now a hook.
 */
export const clutchElementConfig = (
  element: React.FunctionComponent,
  config: {
    icon?: string;
    styleSelectors?: { name?: string; value: string }[];
  }
): void => logger.debug(`Clutch Element Config: ${element.name}`, config);

/**
 * Configuration function for Clutch Functions
 *
 * @param fn - The function to be used in Clutch
 * @param config - Additional information about the function
 * @param config.inputSchema - Optional input schema for the function, used by AI
 * @returns void - This function only logs debug information
 */
export const clutchFunctionConfig = (
  // eslint-disable-next-line
  fn: Function,
  config: {
    systemPrompt?: string;
    inputSchema?: Record<string, unknown>;
  }
): void => logger.debug(`Clutch Function Config: ${fn.name}`, config);

/**
 * Finds the entry instance that matches the given properties or returns the first entry if no match is found.
 *
 * @param properties - The properties to match against entry variant IDs
 * @param entryInstances - Array of entry instances to search through
 * @returns The ID of the matching entry instance, or undefined if no entries exist
 */
export const getEntryInstanceId = (
  properties: Record<string, unknown>,
  entryInstances: Array<{ id: string; variantIds?: Record<string, unknown> }>
): string | undefined => {
  const entry =
    entryInstances.find(entry => {
      const entryVariants = entry.variantIds || {};

      return Object.keys(entryVariants).every(
        varKey => entryVariants[varKey] === properties[varKey]
      );
    }) || entryInstances[0];

  return entry?.id;
};

/**
 * Merges slot props with child props, handling special cases for event handlers, styles, and className.
 * Event handlers are chained, styles are merged as objects, and classNames are concatenated.
 *
 * @param slotProps - Properties from the slot component
 * @param childProps - Properties from the child component
 * @returns Merged properties object with special handling for events, styles, and className
 */
function mergeProps(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>
): Record<string, unknown> {
  const overrideProps = { ...childProps };

  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);

    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args: unknown[]) => {
          if (typeof childPropValue === 'function') childPropValue(...args);
          if (typeof slotPropValue === 'function')
            return slotPropValue(...args);
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === 'style') {
      overrideProps[propName] = {
        ...(typeof slotPropValue === 'object' ? slotPropValue : {}),
        ...(typeof childPropValue === 'object' ? childPropValue : {}),
      };
    } else if (propName === 'className') {
      overrideProps[propName] = [slotPropValue, childPropValue]
        .filter(Boolean)
        .join(' ');
    }
  }

  return { ...slotProps, ...overrideProps };
}

/**
 * Clones React children and applies the given props to each child element.
 * Filters out debug-related props and handles both single children and arrays of children.
 *
 * @param children - React children to clone (can be single child or array)
 * @param props - Properties to apply to each child element
 * @returns Cloned React children with applied properties
 */
export function cloneChildren(
  children: React.ReactNode,
  props: Record<string, unknown>
): React.ReactNode {
  if (Object.keys(props).length === 0) {
    return children;
  }

  const newProps = { ...props };

  // Remove debug-related props that shouldn't be passed to children
  delete newProps['debug-id'];
  delete newProps['debug-reports'];
  delete newProps['debug-parent'];
  delete newProps['debug-loop'];
  delete newProps['debug-stop'];
  delete newProps['debug-is-section'];
  delete newProps['debug-name'];
  delete newProps['data-d'];
  delete newProps['clutchId'];

  const cloneChild = (child: React.ReactNode, index?: number) => {
    if (React.isValidElement(child)) {
      const clonedElement = React.cloneElement(child, {
        key: index,
        ...mergeProps((child.props || {}) as Record<string, unknown>, newProps),
      });

      delete newProps.ref;

      return clonedElement;
    } else {
      return child;
    }
  };

  return Array.isArray(children)
    ? children.map(cloneChild)
    : cloneChild(children);
}

/**
 * Performs a shallow comparison between two objects to determine if they are equal.
 * Only compares the first level of properties, not nested objects.
 *
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns True if objects are shallowly equal, false otherwise
 */
export const shallowEqual = (
  obj1: Record<string, unknown> | undefined,
  obj2: Record<string, unknown> | undefined
): boolean => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return !keys1.some(key => obj1[key] !== obj2[key]);
};

/**
 * Extracts text content from a React element or string recursively.
 *
 * @param elem - React element or string to extract text from
 * @returns Concatenated text content of the element and its children
 */
function getReactElementTextContent(elem: React.ReactElement | string): string {
  if (!elem) {
    return '';
  }

  if (typeof elem === 'string') {
    return elem;
  }

  const children = (elem as React.ReactElement<{ children?: React.ReactNode }>)
    ?.props?.children;

  if (children && Array.isArray(children)) {
    return children.map(getReactElementTextContent).join('');
  }

  return getReactElementTextContent(children as React.ReactElement | string);
}

/**
 * Serializes an object by converting React elements to text and functions to strings.
 * Recursively processes arrays and objects to create a serializable representation.
 *
 * @param obj - The object to serialize
 * @returns Serialized version of the object
 */
export function serialize(obj: unknown): unknown {
  if (obj && React.isValidElement(obj)) {
    return getReactElementTextContent(obj);
  }

  if (typeof obj === 'function') {
    try {
      // Convert function to string representation
      return obj.toString();
    } catch (err) {
      // If conversion fails, return a placeholder
      return '[Function]';
    }
  }

  if (obj === undefined || obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj && Array.isArray(obj)) {
    return obj.map(serialize);
  }

  const copiedObject: Record<string, unknown> = {};

  Object.keys(obj).forEach(key => {
    copiedObject[key] = serialize((obj as Record<string, unknown>)[key]);
  });

  return copiedObject;
}

/**
 * Parses search parameters from a URL string into an object.
 *
 * @param searchParams - The search parameters string to parse
 * @returns Parsed search parameters as an object
 */
export function parseSearchParams(
  searchParams: string
): Record<string, unknown> {
  const parsedParams = qs.parse(searchParams, { ignoreQueryPrefix: true });

  return parsedParams;
}

/**
 * Executes a function safely within a try-catch block and logs any errors.
 *
 * @param fn - The function to execute safely
 * @param args - Arguments to pass to the function
 * @returns The result of the function execution, or undefined if an error occurs
 */
export function tryCatchFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ...args: Parameters<T>
): ReturnType<T> | undefined {
  try {
    return fn(...args) as ReturnType<T>;
  } catch (err) {
    logger.error(`Error executing function ${fn.name}`, err);

    return undefined;
  }
}
