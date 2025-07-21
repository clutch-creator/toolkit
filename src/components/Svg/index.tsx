import React from 'react';

type TSvgProps = {
  src: React.ReactElement | string;
} & React.SVGProps<SVGSVGElement>;

export function Svg({ src, ...props }: TSvgProps) {
  if (React.isValidElement(src)) {
    return React.cloneElement(src, props);
  }

  return null;
}
