'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEvent } from '../utils/hooks.js';
import { useFormId } from './context.js';
import {
  selectField,
  selectFormFieldErrors,
  selectFormState,
  selectFormValues,
} from './selectors.js';
import { useFormsStore } from './store.js';
import type { PartialFormState, ValidationRule } from './types.js';

/**
 * Options for configuring a form
 */
export interface UseFormOptions {
  id?: string;
  onSubmit: (values: Record<string, unknown>) => unknown | Promise<unknown>;
  defaultValues?: Record<string, unknown>;
  submitOnChange?: boolean;
  debounceTime?: number;
}

let formIdCounter = 0;

/**
 * Generates a unique form ID automatically.
 * Used when no explicit ID is provided to useForm.
 */
function useAutoFormId() {
  return useMemo(() => {
    formIdCounter += 1;

    return `form-${formIdCounter}`;
  }, []);
}

/**
 * Main form hook that manages form state, submission, and lifecycle.
 * Handles form initialization, cleanup, and provides submit/reset handlers.
 */
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

  // Use direct store access for actions using useShallow for stable references
  const { createForm, destroyForm, resetForm, submitForm } = useFormsStore(
    useShallow(state => ({
      createForm: state.createForm,
      destroyForm: state.destroyForm,
      resetForm: state.resetForm,
      submitForm: state.submitForm,
    }))
  );

  const stableDefaultValues = useRef(defaultValues);
  const stableOnSubmit = useEvent(onSubmit);

  // Initialize form
  useEffect(() => {
    createForm(formId, {
      defaultValues: stableDefaultValues.current,
      submitOnChange,
      debounceTime,
      onSubmit: stableOnSubmit,
    });

    return () => {
      destroyForm(formId);
    };
  }, [
    createForm,
    debounceTime,
    destroyForm,
    formId,
    stableOnSubmit,
    submitOnChange,
  ]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      event?.stopPropagation();

      // Use the store's centralized submitForm action
      return await submitForm(formId);
    },
    [submitForm, formId]
  );

  // Reset form
  const onReset = useCallback(() => {
    resetForm(formId, defaultValues);
  }, [resetForm, formId, defaultValues]);

  return {
    formId,
    onSubmit: handleSubmit,
    onReset: onReset,
  };
}

/**
 * Hook to access the current form state.
 * Returns default state values if the form doesn't exist.
 */
export function useFormState(formId?: string): PartialFormState {
  const contextFormId = useFormId();
  const validFormId = formId || contextFormId;
  const formState = useFormsStore(
    useShallow(state => selectFormState(state, validFormId))
  );

  // Return default values if form doesn't exist
  if (!formState) {
    return {
      isSubmitting: false,
      isSubmitted: false,
      isValid: true,
      isDirty: false,
      isValidating: false,
      error: undefined,
      response: undefined,
      successMessage: undefined,
    };
  }

  return formState;
}

/**
 * Hook to get field errors for all fields in a form.
 */
export function useFormFieldsErrors(formId?: string) {
  const contextFormId = useFormId();
  const validFormId = formId || contextFormId;
  const fieldErrors = useFormsStore(
    useShallow(state => selectFormFieldErrors(state, validFormId))
  );

  return fieldErrors;
}

type TUseFormFieldOptions<T = string> = {
  name: string;
  /**
   * For checkbox/radio inputs: the concrete option value represented by this field instance.
   * When provided, `checked` will be derived by comparing the form value with this option.
   */
  value?: unknown;
  /**
   * When true, the field accepts multiple selections (e.g., a checkbox group with the same name).
   * The stored value becomes an array and `checked` is computed via inclusion.
   */
  multiple?: boolean;
  defaultValue?: T | undefined;
} & ValidationRule;

/**
 * Hook for managing individual form field state, validation, and event handlers.
 * Automatically registers the field with the form and provides onChange/onBlur handlers.
 */
export function useFormField<T = string>(props: TUseFormFieldOptions<T>) {
  const {
    name: fieldName,
    value: optionValue,
    multiple = false,
    defaultValue,
    ...rules
  } = props;

  const formId = useFormId();

  // Use direct store access for actions using useShallow for stable references
  const { registerField, setFieldValue, setFieldTouched } = useFormsStore(
    useShallow(state => ({
      registerField: state.registerField,
      setFieldValue: state.setFieldValue,
      setFieldTouched: state.setFieldTouched,
    }))
  );

  // Auto-register field
  useEffect(() => {
    // If multiple selection is enabled and no default is provided, default to an empty array.
    let resolvedDefault = defaultValue as unknown;

    if (resolvedDefault === undefined && multiple) {
      resolvedDefault = [] as unknown[];
    }

    registerField(formId, fieldName, {
      rules,
      ...(resolvedDefault !== undefined && { defaultValue: resolvedDefault }),
    });

    return () => {
      // Optionally unregister on unmount
      // unregisterField(formId, fieldName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, fieldName]);

  const field = useFormsStore(state => selectField(state, formId, fieldName));

  const onChange = useEvent(
    (eventOrValue: React.ChangeEvent<HTMLInputElement> | unknown) => {
      const isEvent = typeof event === 'object' && 'target' in event;
      const changeValue = isEvent
        ? (eventOrValue as React.ChangeEvent<HTMLInputElement>).target.value
        : eventOrValue;

      // DOM event path
      if (multiple || optionValue !== undefined) {
        const isChecked = !!changeValue;

        if (multiple) {
          const current = (field?.value as unknown[]) ?? [];
          let next: unknown[];

          if (isChecked) {
            // add if not present
            next = current.some(v => Object.is(v, optionValue))
              ? current
              : [...current, optionValue];
          } else {
            // remove if present
            next = current.filter(v => !Object.is(v, optionValue));
          }
          setFieldValue(formId, fieldName, next);
        } else {
          // Single selection
          setFieldValue(formId, fieldName, isChecked ? optionValue : undefined);
        }

        return;
      }

      // Direct value setting (non-DOM)
      setFieldValue(formId, fieldName, changeValue);
    }
  );

  const onBlur = useEvent(() => {
    // Mark field as touched when it loses focus
    setFieldTouched(formId, fieldName, true);
  });

  // Compute checked flag for checkbox/radio-style usage
  const checked = useMemo(() => {
    if (multiple) {
      const arr = (field?.value as unknown[]) ?? [];

      return (
        optionValue !== undefined && arr.some(v => Object.is(v, optionValue))
      );
    }

    if (optionValue !== undefined) {
      return field?.value === optionValue;
    }

    return Boolean(field?.value);
  }, [field?.value, multiple, optionValue]);

  return {
    value: field?.value as T,
    checked,
    onChange,
    onBlur,
    error: field?.error,
    errors: field?.errors,
    isInvalid: !!field?.error,
    isDirty: field?.dirty || false,
    isTouched: field?.touched || false,
    isValidating: field?.isValidating || false,
    isValid: field?.isValid !== false,
  };
}

/**
 * Hook to get a specific field's error message.
 */
export const useFormFieldError = (fieldName: string) => {
  const formId = useFormId();
  const fieldError = useFormsStore(
    state => selectField(state, formId, fieldName)?.error
  );

  return fieldError;
};

/**
 * Hook to get a specific field's validating status.
 */
export const useFormFieldIsValidating = (fieldName: string) => {
  const formId = useFormId();
  const fieldValidating = useFormsStore(
    state => selectField(state, formId, fieldName)?.isValidating
  );

  return fieldValidating;
};

/**
 * Hook to get a specific field's validating status.
 */
export const useFormFieldIsValid = (fieldName: string) => {
  const formId = useFormId();
  const fieldValid = useFormsStore(
    state => selectField(state, formId, fieldName)?.isValid
  );

  return fieldValid;
};

/**
 * Hook to get a specific field's validating status.
 */
export const useFormFieldIsDirty = (fieldName: string) => {
  const formId = useFormId();
  const fieldDirty = useFormsStore(
    state => selectField(state, formId, fieldName)?.dirty
  );

  return fieldDirty;
};

/**
 * Hook to get all form values for a specific form.
 */
export const useFormValues = (formId: string) => {
  return useFormsStore(useShallow(state => selectFormValues(state, formId)));
};
