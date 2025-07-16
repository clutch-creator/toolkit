import React from 'react';

export function Svg({ src, ...props }) {
  if (React.isValidElement(src)) {
    return React.cloneElement(src, props);
  }

  return null;
}
