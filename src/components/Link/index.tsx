'use client';

import { default as NextLink } from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useMemo } from 'react';
import { TComplexUrl, TParam } from './types.js';

type TParamsLinkProps = {
  href: string;
  replaceParams?: boolean;
  toggleParams?: boolean;
  params: TParam[];
  children: (props: { calculatedHref: string }) => React.ReactNode;
};

const ParamsLink = ({
  href = '',
  replaceParams,
  toggleParams,
  params,
  children,
}: TParamsLinkProps) => {
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

type TAriaAttributes = Record<string, string | boolean>;

type TDataAttributes = Record<string, string | boolean>;

type TLinkProps = {
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  download?: boolean;
  href: TComplexUrl;
  [key: string]: unknown;
};

export function Link({
  className,
  children,
  disabled,
  download,
  href = '',
  ...props
}: TLinkProps) {
  const isUsingLinkDirectly = typeof href === 'string';
  let safeHref = isUsingLinkDirectly ? href : '';
  let replaceParams = false;
  let toggleParams = false;
  let params: TParam[] = [];

  if (!isUsingLinkDirectly && typeof href === 'object') {
    replaceParams = href.replaceParams || false;
    toggleParams = href.toggleParams || false;
    params = href.params || [];
    safeHref = href.url;
  }

  const currentPathname = usePathname();

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
      }
    },
    [disabled]
  );

  const [ariaAttributes, dataAttributes]: [TAriaAttributes, TDataAttributes] =
    useMemo(() => {
      const ariaAttributes: TAriaAttributes = {};
      const dataAttributes: TDataAttributes = {};

      const isActive =
        currentPathname === (safeHref || currentPathname).split('?')[0];

      if (isActive) {
        ariaAttributes['aria-current'] = 'page';
      }

      if (disabled) {
        ariaAttributes['aria-disabled'] = true;
        dataAttributes['data-disabled'] = true;
      }

      return [ariaAttributes, dataAttributes];
    }, [currentPathname, safeHref, disabled]);

  if (download) {
    return (
      <a
        {...ariaAttributes}
        {...dataAttributes}
        className={className}
        href={disabled ? undefined : safeHref}
        role={disabled ? 'link' : undefined}
        onClick={onClick}
        tabIndex={disabled ? -1 : undefined}
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
        {...dataAttributes}
        className={className}
        role='link'
        onClick={onClick}
        tabIndex={-1}
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
        {...dataAttributes}
        href={safeHref}
        className={className}
        onClick={onClick}
        {...props}
        prefetch={!!props.prefetch}
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
            {...dataAttributes}
            className={className}
            onClick={onClick}
            href={calculatedHref}
            {...props}
            prefetch={!!props.prefetch}
          >
            {children}
          </NextLink>
        )}
      </ParamsLink>
    </Suspense>
  );
}
