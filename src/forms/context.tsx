import { createContext, useContext } from 'react';

const FormContext = createContext<string | null>(null);

export function useFormId(): string {
  const contextFormId = useContext(FormContext);

  return contextFormId || 'global';
}

export function FormProvider({
  children,
  formId,
}: {
  children: React.ReactNode;
  formId: string;
}) {
  return <FormContext.Provider value={formId}>{children}</FormContext.Provider>;
}
