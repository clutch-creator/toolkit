'use client';

import { useMemo, useState } from 'react';

type NotFoundRedirectProps = {
  children: React.ReactNode;
};

export function NotFoundRedirect({ children }: NotFoundRedirectProps) {
  const [loading, setLoading] = useState(true);
  const pathname =
    typeof window !== 'undefined' && window.location.pathname !== 'not-found';

  useMemo(() => {
    if (pathname) {
      fetch(window.location.href)
        .then(response => {
          if (response.ok) {
            window.location.reload();
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [pathname, setLoading]);

  return loading ? null : <>{children}</>;
}
