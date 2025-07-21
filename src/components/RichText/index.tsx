import React from 'react';

type TRichTextProps = {
  children: React.ReactNode;
  tag?: keyof React.JSX.IntrinsicElements;
  [key: string]: unknown;
};

export const RichText = ({
  children,
  tag = 'span',
  ...props
}: TRichTextProps) => {
  const CustomTag = tag as React.ElementType;

  if (children === undefined || children === null) {
    return null;
  }

  if (typeof children === 'string') {
    return (
      <CustomTag dangerouslySetInnerHTML={{ __html: children }} {...props} />
    );
  }

  return <CustomTag {...props}>{children}</CustomTag>;
};
