import React, { useCallback } from 'react';

export const getEntryInstanceId = (properties, entryInstances) => {
  const entry =
    entryInstances.find(entry => {
      const entryVariants = entry.variantIds || {};

      return Object.keys(entryVariants).every(
        varKey => entryVariants[varKey] === properties[varKey]
      );
    }) || entryInstances[0];

  return entry?.id;
};

function mergeProps(slotProps, childProps) {
  const overrideProps = { ...childProps };

  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);

    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args) => {
          childPropValue(...args);
          slotPropValue(...args);
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === 'style') {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === 'className') {
      overrideProps[propName] = [slotPropValue, childPropValue]
        .filter(Boolean)
        .join(' ');
    }
  }

  return { ...slotProps, ...overrideProps };
}

export function cloneChildren(children, { ...props }) {
  if (Object.keys(props).length === 0) {
    return children;
  }

  delete props['debug-id'];
  delete props['debug-reports'];
  delete props['debug-parent'];
  delete props['debug-loop'];
  delete props['debug-stop'];
  delete props['debug-is-section'];
  delete props['debug-name'];
  delete props['data-d'];

  const cloneChild = useCallback((child, index = undefined) => {
    if (React.isValidElement(child)) {
      const clonedElement = React.cloneElement(child, {
        key: index,
        ...mergeProps(child.props, props),
      });

      delete props.ref;

      return clonedElement;
    } else {
      return child;
    }
  }, []);

  return Array.isArray(children)
    ? children.map(cloneChild)
    : cloneChild(children);
}

export const shallowEqual = (
  obj1: Record<string, any> | undefined,
  obj2: Record<string, any> | undefined
): boolean => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return !keys1.some(key => obj1[key] !== obj2[key]);
};
