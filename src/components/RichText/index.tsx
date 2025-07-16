export const RichText = ({ children, tag = 'span', ...props }) => {
  const CustomTag = tag;

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
