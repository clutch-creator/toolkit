'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useEvent } from '../utils/hooks.js';
import { useFormId } from './context.js';
import {
  selectCreateForm,
  selectDestroyForm,
  selectField,
  selectFormState,
  selectFormValues,
  selectRegisterField,
  selectResetForm,
  selectSetFieldTouched,
  selectSetFieldValue,
  selectSubmitForm,
} from './selectors.js';
import { useFormsStore } from './store.js';
import type { ValidationRule } from './types.js';

export interface UseFormOptions {
  id?: string;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  defaultValues?: Record<string, unknown>;
  submitOnChange?: boolean;
  debounceTime?: number;
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
  const submitForm = useFormsStore(selectSubmitForm);

  const stableDefaultValues = useRef(defaultValues);
  const stableOnSubmit = useEvent(onSubmit as (...args: unknown[]) => unknown);

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
    stableDefaultValues,
    destroyForm,
    formId,
    onSubmit,
    stableOnSubmit,
    submitOnChange,
  ]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      // Use the store's centralized submitForm action
      await submitForm(formId, event);
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

export function useFormState(formId: string) {
  return useFormsStore(state => selectFormState(state, formId));
}

export function useFormField(props: {
  name: string;
  defaultValue?: unknown;
  required?: boolean;
  requiredMessage?: string;
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  pattern?: RegExp;
  patternMessage?: string;
  validate?:
    | ((
        value: unknown
      ) => string | boolean | undefined | Promise<string | boolean | undefined>)
    | Record<
        string,
        (
          value: unknown
        ) =>
          | string
          | boolean
          | undefined
          | Promise<string | boolean | undefined>
      >;
}) {
  const {
    name: fieldName,
    defaultValue,
    required,
    requiredMessage,
    minLength,
    minLengthMessage,
    maxLength,
    maxLengthMessage,
    pattern,
    patternMessage,
    validate,
  } = props;

  const formId = useFormId();

  // Use direct store access for actions
  const registerField = useFormsStore(selectRegisterField);
  const setFieldValue = useFormsStore(selectSetFieldValue);
  const setFieldTouched = useFormsStore(selectSetFieldTouched);

  // Build validation rules from props
  const rules: ValidationRule = useMemo(
    () => ({
      ...(required !== undefined && { required, requiredMessage }),
      ...(minLength !== undefined && { minLength, minLengthMessage }),
      ...(maxLength !== undefined && { maxLength, maxLengthMessage }),
      ...(pattern && { pattern, patternMessage }),
      ...(validate && { validate }),
    }),
    [
      required,
      requiredMessage,
      minLength,
      minLengthMessage,
      maxLength,
      maxLengthMessage,
      pattern,
      patternMessage,
      validate,
    ]
  );

  // Auto-register field
  useEffect(() => {
    registerField(formId, fieldName, {
      rules,
      ...(defaultValue !== undefined && { defaultValue }),
    });

    return () => {
      // Optionally unregister on unmount
      // unregisterField(formId, fieldName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, fieldName]);

  const field = useFormsStore(state => selectField(state, formId, fieldName));

  const onChange = useEvent(
    (event: React.ChangeEvent<HTMLInputElement> | unknown) => {
      const value =
        event && typeof event === 'object' && 'target' in event
          ? (event as React.ChangeEvent<HTMLInputElement>).target.value
          : event;

      setFieldValue(formId, fieldName, value);
    }
  );

  const onBlur = useEvent(() => {
    // Mark field as touched when it loses focus
    setFieldTouched(formId, fieldName, true);
  });

  return {
    value: field.value,
    onChange,
    onBlur,
    isInvalid: !!field.error,
    isDirty: field.dirty || false,
    isTouched: field.touched || false,
    isValidating: field.isValidating || false,
    isValid: field.isValid !== false,
  };
}

export const useFormValues = (formId: string) => {
  return useFormsStore(state => selectFormValues(state, formId));
};
