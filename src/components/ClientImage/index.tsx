'use client';

import NextImage from 'next/image';
import React, { cloneElement, use } from 'react';

type TClientImageProps = {
  // @deprecated This component is used to wrap a lazy-loaded image component.
  children?: React.LazyExoticComponent<React.ComponentType<unknown>>;
} & React.ComponentProps<typeof NextImage>;

export const ClientImage = ({ children, ...props }: TClientImageProps) => {
  // @deprecated: This component is used to wrap a lazy-loaded image component.
  if (children) {
    const child =
      children?.$$typeof === Symbol.for('react.lazy')
        ? // @ts-expect-error next react lazy payload
          use(children._payload)
        : children;

    return React.isValidElement(child)
      ? cloneElement(child, { ...props })
      : child;
  }

  if (!props.src) return null;

  let placeholderVal = props.placeholder;

  if (typeof placeholderVal === 'boolean') {
    placeholderVal = placeholderVal ? 'blur' : 'empty';
  }

  return (
    <NextImage
      {...props}
      sizes={props.sizes || '100vw'}
      placeholder={placeholderVal}
    />
  );
};
