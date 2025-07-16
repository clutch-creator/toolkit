import { useMemo } from 'react';

type TApplyHooksProps = {
  hooks: any[];
  vars?: any;
  pagePath?: string;
  pageSettings?: any;
  children: any;
};

export function ApplyHooks({
  hooks,
  vars,
  pagePath,
  pageSettings,
  children,
}: TApplyHooksProps) {
  let newVars = { ...vars };

  const result = useMemo(() => {
    return hooks.reduce((acc, HookComponent) => {
      if (!HookComponent) return acc;

      return (
        <HookComponent
          vars={vars}
          pageSettings={pageSettings}
          pagePath={pagePath}
        >
          {hookVars => {
            if (hookVars) newVars = { ...newVars, ...hookVars };

            if (typeof acc === 'function') {
              return acc(newVars);
            }

            return acc;
          }}
        </HookComponent>
      );
    }, children);
  }, [hooks, vars, pagePath, pageSettings, children]);

  return result;
}
