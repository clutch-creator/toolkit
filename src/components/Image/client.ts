
'use client';
import React, { use, cloneElement } from 'react';

export const ClientImage = ({ children, ...props }: { children: React.ReactNode }) => {
  const child =
    children?.$$typeof === Symbol.for('react.lazy')
      ? use(children._payload)
      : children;

  return React.isValidElement(child)
    ? cloneElement(child, { ...props })
    : child;
};
