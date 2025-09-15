'use client';

import { useEffect } from 'react';
import { useFormsStore } from './store.js';
import type {
  FormMode,
  FormState,
  SubmitErrorHandler,
  SubmitHandler,
  ValidationRule,
} from './types.js';

export function useForm(formId: string, options?: Partial<FormState>) {
  const store = useFormsStore();

  // Initialize form if it doesn't exist
  useEffect(() => {
    if (!store.forms[formId]) {
      store.createForm(formId, options);
    }

    return () => {
      // Optionally clean up form on unmount
      // store.destroyForm(formId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const form = store.forms[formId] || {
    fields: {},
    isSubmitting: false,
    isSubmitted: false,
    isSubmitSuccessful: false,
    submitCount: 0,
    isValid: true,
    isValidating: false,
    isDirty: false,
    errors: {},
    defaultValues: {},
    mode: 'onSubmit' as FormMode,
    reValidateMode: 'onChange' as FormMode,
    shouldFocusError: true,
  };

  // Form submission
  const handleSubmit =
    (onValid: SubmitHandler, onInvalid?: SubmitErrorHandler) =>
    async (event?: React.FormEvent) => {
      event?.preventDefault();

      store.setFormState(formId, {
        isSubmitting: true,
        submitCount: (form.submitCount || 0) + 1,
      });

      const isValid = await store.validateForm(formId);

      if (isValid) {
        try {
          const values = store.getValues(formId) as Record<string, unknown>;

          await onValid(values, event as React.BaseSyntheticEvent);
          store.setFormState(formId, {
            isSubmitting: false,
            isSubmitted: true,
            isSubmitSuccessful: true,
          });
        } catch (submitError) {
          store.setFormState(formId, {
            isSubmitting: false,
            isSubmitted: true,
            isSubmitSuccessful: false,
          });
          throw submitError;
        }
      } else {
        store.setFormState(formId, {
          isSubmitting: false,
          isSubmitted: true,
          isSubmitSuccessful: false,
        });

        if (onInvalid) {
          onInvalid(form.errors || {}, event as React.BaseSyntheticEvent);
        }
      }
    };

  return {
    // Form state
    ...form,
    formState: form,

    // Methods
    handleSubmit,
    reset: (values?: Record<string, unknown>) =>
      store.resetForm(formId, values),
    setValue: (fieldName: string, value: unknown) =>
      store.setFieldValue(formId, fieldName, value),
    getValue: (fieldName: string) => store.getValues(formId, fieldName),
    getValues: () => store.getValues(formId),
    setError: (fieldName: string, error: string | string[]) =>
      store.setFieldError(formId, fieldName, error),
    clearErrors: (fieldNames?: string | string[]) =>
      store.clearErrors(formId, fieldNames),
    trigger: (fieldNames?: string | string[]) =>
      store.trigger(formId, fieldNames),
  };
}

export function useFormField(
  formId: string,
  fieldName: string,
  rules?: ValidationRule
) {
  const store = useFormsStore();

  // Auto-register field
  useEffect(() => {
    store.registerField(formId, fieldName, { rules });

    return () => {
      // Optionally unregister on unmount
      // store.unregisterField(formId, fieldName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, fieldName, rules]);

  const form = store.forms[formId];
  const field = form?.fields[fieldName] || {
    value: '',
    error: undefined,
    errors: undefined,
    touched: false,
    dirty: false,
    isValid: true,
    isValidating: false,
    defaultValue: '',
  };

  const setValue = (value: unknown) => {
    // No longer need to pass options - store handles it internally
    store.setFieldValue(formId, fieldName, value);
  };

  const validate = () => {
    return store.validateField(formId, fieldName);
  };

  const setTouched = (touched = true) => {
    store.setFieldTouched(formId, fieldName, touched);
  };

  const setError = (error?: string | string[]) => {
    store.setFieldError(formId, fieldName, error);
  };

  return {
    // Field state
    value: field.value,
    error: field.error,
    errors: field.errors,
    touched: field.touched,
    dirty: field.dirty,
    isValid: field.isValid,
    isValidating: field.isValidating,

    // Field methods
    setValue,
    validate,
    setTouched,
    setError,

    // Input props
    field: {
      name: fieldName,
      value: field.value,
      onChange: (event: React.ChangeEvent<HTMLInputElement> | unknown) => {
        const value =
          event && typeof event === 'object' && 'target' in event
            ? (event as React.ChangeEvent<HTMLInputElement>).target.value
            : event;

        // setValue now handles validation and touching internally
        setValue(value);
      },
      onBlur: () => {
        setTouched(true);
        if (form?.mode === 'onBlur' || form?.reValidateMode === 'onBlur') {
          validate();
        }
      },
    },

    // Form state helpers
    fieldState: {
      invalid: !!field.error,
      isDirty: field.dirty,
      isTouched: field.touched,
      isValidating: field.isValidating,
      error: field.error,
    },
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

export function useFormContext(formId: string) {
  return useForm(formId);
}
