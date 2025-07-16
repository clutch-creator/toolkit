'use client';

import { default as NextLink } from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useMemo } from 'react';

const ParamsLink = ({
  href = '',
  replaceParams,
  toggleParams,
  params,
  children,
}) => {
  const searchParams = useSearchParams();

  const calculatedHref = useMemo(() => {
    const resultSearchParams = replaceParams
      ? new URLSearchParams()
      : new URLSearchParams(searchParams);

    // Merge search parameters from queryEntries into hrefSearchParams
    params.forEach(({ name, value }) => {
      if (toggleParams) {
        if (!value || resultSearchParams.has(name, value)) {
          resultSearchParams.delete(name);
        } else {
          resultSearchParams.set(name, value);
        }
      } else if (
        !resultSearchParams.has(name, value) &&
        value !== undefined &&
        value !== null
      ) {
        resultSearchParams.append(name, value);
      }
    });

    const finalSearchParams = resultSearchParams.toString();

    return `${href}?${finalSearchParams || ''}`;
  }, [href, searchParams, replaceParams, toggleParams, params]);

  return children({ calculatedHref });
};

export function Link({
  className,
  children,
  disabled,
  download,
  href = '',
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  download?: boolean;
  href:
    | string
    | {
        url: string;
        params?: Record<string, string>[];
        toggleParams?: boolean;
        replaceParams?: boolean;
      };
  [key: string]: any;
}) {
  const isUsingLinkDirectly = typeof href === 'string';
  let safeHref = isUsingLinkDirectly ? href : '';
  let replaceParams = false;
  let toggleParams = false;
  let params = [];

  if (!isUsingLinkDirectly && typeof href === 'object') {
    replaceParams = href.replaceParams;
    toggleParams = href.toggleParams;
    params = href.params;
    safeHref = href.url;
  }

  const currentPathname = usePathname();

  const onClick = useCallback(
    event => {
      if (disabled) {
        event.preventDefault();
      }
    },
    [disabled]
  );

  const ariaAttributes: Record<string, any> = useMemo(() => {
    const ariaAttributes = {};

    const isActive =
      currentPathname === (safeHref || currentPathname).split('?')[0];

    if (isActive) {
      ariaAttributes['aria-current'] = 'page';
    }

    if (disabled) {
      ariaAttributes['aria-disabled'] = true;
    }

    return ariaAttributes;
  }, [currentPathname, safeHref, disabled]);

  if (download) {
    return (
      <a
        {...ariaAttributes}
        ref={ref}
        className={className}
        href={disabled ? undefined : safeHref}
        role={disabled ? 'link' : undefined}
        onClick={onClick}
        download
        {...props}
      >
        {children}
      </a>
    );
  }

  if (disabled) {
    return (
      <a
        {...ariaAttributes}
        role='link'
        ref={ref}
        className={className}
        onClick={onClick}
        {...props}
      >
        {children}
      </a>
    );
  }

  if (isUsingLinkDirectly) {
    return (
      <NextLink
        {...ariaAttributes}
        href={safeHref}
        className={className}
        onClick={onClick}
        download={download}
        {...props}
        prefetch={props.prefetch ?? false}
      >
        {children}
      </NextLink>
    );
  }

  return (
    <Suspense>
      <ParamsLink
        replaceParams={replaceParams}
        toggleParams={toggleParams}
        params={params}
        href={safeHref}
      >
        {({ calculatedHref }) => (
          <NextLink
            {...ariaAttributes}
            className={className}
            onClick={onClick}
            href={calculatedHref}
            {...props}
            prefetch={props.prefetch ?? false}
          >
            {children}
          </NextLink>
        )}
      </ParamsLink>
    </Suspense>
  );
}
