import type { FieldState, FormState } from './types.js';

// Define FormsState type locally since it's not exported
type FormsState = {
  forms: Record<string, FormState>;
  createForm: (formId: string, options?: Record<string, unknown>) => void;
  destroyForm: (formId: string) => void;
  resetForm: (formId: string, defaultValues?: Record<string, unknown>) => void;
  setFormState: (formId: string, state: Partial<FormState>) => void;
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

export const selectFormState = (state: FormsState, formId: string) => {
  const form = state.forms[formId];

  if (!form) return null;

  return {
    isSubmitting: form.isSubmitting || false,
    isSubmitted: form.isSubmitted || false,
    isValid: form.isValid || true,
    isDirty: form.isDirty || false,
    isValidating: form.isValidating || false,
  };
};

export const selectFormValues = (state: FormsState, formId: string) => {
  const form = state.forms[formId];

  if (!form) return {};

  return Object.keys(form.fields).reduce(
    (acc, fieldName) => {
      acc[fieldName] = form.fields[fieldName].value;

      return acc;
    },
    {} as Record<string, unknown>
  );
};

export const selectFormErrors = (state: FormsState, formId: string) => {
  const form = state.forms[formId];

  if (!form) return {};

  return Object.keys(form.fields).reduce(
    (acc, fieldName) => {
      const field = form.fields[fieldName];

      if (field.error) {
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
  const form = state.forms[formId];

  return form?.fields[fieldName];
};

export const selectFieldValue = (
  state: FormsState,
  formId: string,
  fieldName: string
) => {
  const form = state.forms[formId];

  return form?.fields[fieldName]?.value;
};

export const selectFieldError = (
  state: FormsState,
  formId: string,
  fieldName: string
) => {
  const form = state.forms[formId];

  return form?.fields[fieldName]?.error;
};

export const selectFieldState = (
  state: FormsState,
  formId: string,
  fieldName: string
) => {
  const form = state.forms[formId];
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
};

// Store action selectors
export const selectCreateForm = (state: FormsState) => state.createForm;
export const selectDestroyForm = (state: FormsState) => state.destroyForm;
export const selectResetForm = (state: FormsState) => state.resetForm;
export const selectSetFormState = (state: FormsState) => state.setFormState;
export const selectRegisterField = (state: FormsState) => state.registerField;
export const selectSetFieldValue = (state: FormsState) => state.setFieldValue;
export const selectSetFieldTouched = (state: FormsState) =>
  state.setFieldTouched;
export const selectSetFieldError = (state: FormsState) => state.setFieldError;
export const selectValidateForm = (state: FormsState) => state.validateForm;
export const selectValidateField = (state: FormsState) => state.validateField;
