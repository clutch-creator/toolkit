'use client';
import React, { cloneElement, use } from 'react';

export const ClientImage = ({
  children,
  ...props
}: {
  children: React.LazyExoticComponent<React.ComponentType<unknown>>;
}) => {
  const child =
    children?.$$typeof === Symbol.for('react.lazy')
      ? // @ts-expect-error next react lazy payload
        use(children._payload)
      : children;

  return React.isValidElement(child)
    ? cloneElement(child, { ...props })
    : child;
};
