import { useMemo } from 'react';

type THookProps = {
  vars?: Record<string, unknown>;
  pageSettings?: Record<string, unknown>;
  pagePath?: string;
  children: (
    vars: Record<string, unknown>
  ) => React.ReactNode | React.ReactNode;
};

type TApplyHooksProps = {
  hooks: React.FunctionComponent<THookProps>[];
} & THookProps;

export function ApplyHooks({
  hooks,
  vars,
  pagePath,
  pageSettings,
  children,
}: TApplyHooksProps): React.ReactNode {
  let newVars: Record<string, unknown> = { ...vars };

  const result = useMemo(() => {
    return hooks.reduce<(vars: Record<string, unknown>) => React.ReactNode>(
      (acc, HookComponent) => {
        if (!HookComponent) return acc;

        // eslint-disable-next-line react/display-name
        return (vars: Record<string, unknown>) => (
          <HookComponent
            vars={vars}
            pageSettings={pageSettings}
            pagePath={pagePath}
          >
            {(hookVars: Record<string, unknown>) => {
              // eslint-disable-next-line react-hooks/exhaustive-deps
              if (hookVars) newVars = { ...newVars, ...hookVars };

              if (typeof acc !== 'function') return acc;

              return acc(newVars);
            }}
          </HookComponent>
        );
      },
      children
    );
  }, [hooks, vars, pagePath, pageSettings, children]);

  return typeof result === 'function' ? result(newVars) : result;
}
