import React from 'react';
import { logger } from './logger.js';

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
) => logger.log(`Clutch Element Config: ${element.name}`, config);

/**
 * Finds the entry instance that matches the given properties or returns the first entry if no match is found.
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
 */
export function cloneChildren(
  children: React.ReactNode,
  props: Record<string, unknown>
): React.ReactNode {
  if (Object.keys(props).length === 0) {
    return children;
  }

  const newProps = { ...props };

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
