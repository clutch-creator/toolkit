'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import {
  selectCreateForm,
  selectDestroyForm,
  selectForm,
  selectRegisterField,
  selectResetForm,
  selectSetFieldTouched,
  selectSetFieldValue,
  selectSetFormState,
  selectValidateForm,
} from './selectors.js';
import { useFormsStore } from './store.js';
import type { ValidationRule } from './types.js';

// Form Context
const FormContext = createContext<string | null>(null);

export const FormProvider = FormContext.Provider;

export function useFormId() {
  const formId = useContext(FormContext);

  if (!formId) {
    throw new Error('useFormId must be used within a FormProvider');
  }

  return formId;
}

export interface UseFormOptions {
  id?: string;
  onSubmit: (
    values: Record<string, unknown>,
    event?: React.FormEvent
  ) => void | Promise<void>;
  defaultValues?: Record<string, unknown>;
  submitOnChange?: boolean;
  debounceTime?: number;
}

export interface FormState {
  isSubmitting: boolean;
  isSubmitted: boolean;
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
}

export interface FormProps {
  onSubmit: (event: React.FormEvent) => void;
  noValidate: boolean;
  'aria-busy': boolean;
  'aria-invalid': boolean;
}

let formIdCounter = 0;

function useAutoFormId() {
  return useMemo(() => {
    formIdCounter += 1;

    return `form-${formIdCounter}`;
  }, []);
}

export function useForm(options: UseFormOptions) {
  const {
    id,
    onSubmit,
    defaultValues = {},
    submitOnChange = false,
    debounceTime = 300,
  } = options;
  const autoId = useAutoFormId();
  const formId = id || autoId;

  // Use direct store access for actions
  const createForm = useFormsStore(selectCreateForm);
  const destroyForm = useFormsStore(selectDestroyForm);
  const resetForm = useFormsStore(selectResetForm);
  const setFormState = useFormsStore(selectSetFormState);
  const validateForm = useFormsStore(selectValidateForm);

  const form = useFormsStore(state => selectForm(state, formId));

  // Initialize form
  useEffect(() => {
    createForm(formId, {
      defaultValues,
      submitOnChange,
      debounceTime,
      onSubmit,
    });

    return () => {
      destroyForm(formId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  // Derive values with useMemo to avoid recalculations
  const formValues = useMemo(() => {
    if (!form) return defaultValues || {};

    return Object.keys(form.fields).reduce(
      (acc, fieldName) => {
        acc[fieldName] = form.fields[fieldName].value;

        return acc;
      },
      {} as Record<string, unknown>
    );
  }, [form, defaultValues]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();

      if (!form) return;

      try {
        setFormState(formId, { isSubmitting: true });

        // Validate form before submission
        const isValid = await validateForm(formId);

        if (isValid) {
          await onSubmit(formValues, event);
          setFormState(formId, {
            isSubmitting: false,
            isSubmitted: true,
            isSubmitSuccessful: true,
          });
        } else {
          setFormState(formId, {
            isSubmitting: false,
            isSubmitted: true,
            isSubmitSuccessful: false,
          });
        }
      } catch (error) {
        setFormState(formId, {
          isSubmitting: false,
          isSubmitted: true,
          isSubmitSuccessful: false,
        });
        throw error;
      }
    },
    [form, formId, formValues, onSubmit, setFormState, validateForm]
  );

  // Form props for the form element
  const formProps: FormProps = useMemo(
    () => ({
      onSubmit: handleSubmit,
      noValidate: true,
      'aria-busy': form?.isSubmitting || false,
      'aria-invalid': !form?.isValid,
    }),
    [handleSubmit, form?.isSubmitting, form?.isValid]
  );

  // Reset form
  const onFormReset = useCallback(() => {
    resetForm(formId, defaultValues);
  }, [resetForm, formId, defaultValues]);

  // Submit form programmatically
  const onFormSubmit = useCallback(async () => {
    if (!form) return;

    const isValid = await validateForm(formId);

    if (isValid) {
      const currentFormValues = Object.keys(form.fields).reduce(
        (acc, fieldName) => {
          acc[fieldName] = form.fields[fieldName].value;

          return acc;
        },
        {} as Record<string, unknown>
      );

      await onSubmit(currentFormValues);
    }
  }, [form, validateForm, formId, onSubmit]);

  // Form Provider component
  const FormProvider = useCallback(
    ({ children }: { children: React.ReactNode }) => (
      <FormContext.Provider value={formId}>{children}</FormContext.Provider>
    ),
    [formId]
  );

  return {
    formState: form,
    formProps,
    formValues,
    onFormReset,
    onFormSubmit,
    FormProvider,
  };
}

export function useFormField(props: { name: string; rules?: ValidationRule }) {
  const { name: fieldName, rules } = props;
  const formId = useFormId();

  // Use direct store access for actions
  const registerField = useFormsStore(selectRegisterField);
  const setFieldValue = useFormsStore(selectSetFieldValue);
  const setFieldTouched = useFormsStore(selectSetFieldTouched);

  // Use simple state selection
  const form = useFormsStore(state => state.forms[formId]);

  // Auto-register field
  useEffect(() => {
    registerField(formId, fieldName, { rules });

    return () => {
      // Optionally unregister on unmount
      // store.unregisterField(formId, fieldName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, fieldName, rules]);

  // Derive field state with useMemo
  const fieldState = useMemo(() => {
    const field = form?.fields[fieldName];

    if (!field) {
      return {
        value: '',
        error: undefined,
        touched: false,
        dirty: false,
        isValid: true,
        isValidating: false,
      };
    }

    return {
      value: field.value,
      error: field.error,
      touched: field.touched,
      dirty: field.dirty,
      isValid: field.isValid,
      isValidating: field.isValidating,
    };
  }, [form, fieldName]);

  const setValue = (value: unknown) => {
    setFieldValue(formId, fieldName, value);
  };

  // Field props for input elements
  const fieldProps = {
    name: fieldName,
    value: (fieldState.value as string) || '',
    onChange: (event: React.ChangeEvent<HTMLInputElement> | unknown) => {
      const value =
        event && typeof event === 'object' && 'target' in event
          ? (event as React.ChangeEvent<HTMLInputElement>).target.value
          : event;

      setValue(value);
    },
    onBlur: () => {
      // Mark field as touched when it loses focus
      setFieldTouched(formId, fieldName, true);
    },
  };

  // Field state for return
  const fieldStateForReturn = {
    invalid: !!fieldState.error,
    isDirty: fieldState.dirty,
    isTouched: fieldState.touched,
    isValidating: fieldState.isValidating,
    error: fieldState.error,
  };

  return {
    fieldProps,
    fieldState: fieldStateForReturn,
  };
}

export function useFormState(formId: string) {
  const store = useFormsStore();
  const form = store.forms[formId];

  // Derive dirtyFields and touchedFields from individual field states
  const dirtyFields: Record<string, boolean> = {};
  const touchedFields: Record<string, boolean> = {};

  if (form?.fields) {
    Object.entries(form.fields).forEach(([fieldName, field]) => {
      dirtyFields[fieldName] = field.dirty || false;
      touchedFields[fieldName] = field.touched || false;
    });
  }

  return {
    isDirty: form?.isDirty || false,
    isLoading: form?.isValidating || false,
    isSubmitted: form?.isSubmitted || false,
    isSubmitting: form?.isSubmitting || false,
    isSubmitSuccessful: form?.isSubmitSuccessful || false,
    isValid: form?.isValid || true,
    isValidating: form?.isValidating || false,
    submitCount: form?.submitCount || 0,
    dirtyFields,
    touchedFields,
    errors: form?.errors || {},
  };
}
