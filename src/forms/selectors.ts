import type { FieldState, FormState, PartialFormState } from './types.js';

// Cached empty objects to prevent unnecessary re-renders
const EMPTY_FIELD_ERRORS: Record<string, string> = {};
const EMPTY_VALUES: Record<string, unknown> = {};

// Define FormsState type locally since it's not exported
type FormsState = {
  forms: Record<string, FormState>;
  createForm: (formId: string, options?: Record<string, unknown>) => void;
  destroyForm: (formId: string) => void;
  resetForm: (formId: string, defaultValues?: Record<string, unknown>) => void;
  setFormState: (formId: string, state: Partial<FormState>) => void;
  submitForm: (formId: string, event?: React.FormEvent) => Promise<void>;
  registerField: (
    formId: string,
    fieldName: string,
    config?: Partial<FieldState>
  ) => void;
  setFieldValue: (formId: string, fieldName: string, value: unknown) => void;
  setFieldTouched: (
    formId: string,
    fieldName: string,
    touched?: boolean
  ) => void;
  setFieldError: (
    formId: string,
    fieldName: string,
    error?: string | string[]
  ) => void;
  validateForm: (formId: string) => Promise<boolean>;
  validateField: (formId: string, fieldName: string) => Promise<boolean>;
};

// Form selectors
export const selectForm = (state: FormsState, formId: string) =>
  state.forms[formId];

export const selectFormFieldErrors = (state: FormsState, formId: string) => {
  const form = selectForm(state, formId);

  if (!form) return EMPTY_FIELD_ERRORS;

  // Check if there are actually any errors before creating a new object
  const hasErrors = Object.values(form.fields).some(field => field?.error);

  if (!hasErrors) {
    return EMPTY_FIELD_ERRORS; // Return the same empty object reference
  }

  // Create result - Zustand will handle shallow comparison through useShallow
  return Object.keys(form.fields).reduce<Record<string, string>>(
    (acc, fieldName) => {
      const field = form.fields[fieldName];

      if (field?.error) {
        acc[fieldName] = field.error;
      }

      return acc;
    },
    {}
  );
};

export const selectFormState = (
  state: FormsState,
  formId: string
): PartialFormState | undefined => {
  const form = selectForm(state, formId);

  if (!form) return undefined;

  // Return result - Zustand will handle shallow comparison through useShallow
  return {
    isSubmitting: !!form.isSubmitting,
    isSubmitted: !!form.isSubmitted,
    isValid: !!form.isValid,
    isDirty: !!form.isDirty,
    isValidating: !!form.isValidating,
    error: form.error,
    response: form.response,
    successMessage: form.successMessage,
  };
};

export const selectFormValues = (state: FormsState, formId: string) => {
  const form = selectForm(state, formId);

  if (!form) return EMPTY_VALUES;

  // Check if there are actually any fields before creating a new object
  const fieldNames = Object.keys(form.fields);

  if (fieldNames.length === 0) {
    return EMPTY_VALUES; // Return the same empty object reference
  }

  // Create result - Zustand will handle shallow comparison through useShallow
  return fieldNames.reduce(
    (acc, fieldName) => {
      acc[fieldName] = form.fields[fieldName]?.value;

      return acc;
    },
    {} as Record<string, unknown>
  );
};

export const selectFormErrors = (state: FormsState, formId: string) => {
  const form = selectForm(state, formId);

  if (!form) return EMPTY_FIELD_ERRORS;

  return Object.keys(form.fields).reduce(
    (acc, fieldName) => {
      const field = form.fields[fieldName];

      if (field?.error) {
        acc[fieldName] = field.error;
      }

      return acc;
    },
    {} as Record<string, string>
  );
};

// Field selectors
export const selectField = (
  state: FormsState,
  formId: string,
  fieldName: string
) => {
  const form = selectForm(state, formId);

  return form?.fields[fieldName];
};

export const selectFieldValue = (
  state: FormsState,
  formId: string,
  fieldName: string
) => {
  const form = selectForm(state, formId);

  return form?.fields[fieldName]?.value;
};

export const selectFieldError = (
  state: FormsState,
  formId: string,
  fieldName: string
) => {
  const form = selectForm(state, formId);

  return form?.fields[fieldName]?.error;
};

export const selectFieldState = (
  state: FormsState,
  formId: string,
  fieldName: string
) => {
  const field = selectField(state, formId, fieldName);

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
};

export const shouldFieldValidateOnChange = (
  state: FormsState,
  formId: string,
  fieldName: string
) => {
  const form = selectForm(state, formId);
  const field = form?.fields[fieldName];

  if (!form || !field) return false;

  return (
    form.mode === 'onChange' ||
    form.mode === 'all' ||
    (form.reValidateMode === 'onChange' && field.touched)
  );
};

export const shouldFieldTouchOnChange = (state: FormsState, formId: string) => {
  const form = selectForm(state, formId);

  return form?.mode === 'onTouched' || form?.mode === 'all';
};
