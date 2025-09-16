import type { FieldState, FormState, PartialFormState } from './types.js';

// Cached empty objects to prevent unnecessary re-renders
const EMPTY_FIELD_ERRORS: Record<string, string> = {};
const EMPTY_VALUES: Record<string, unknown> = {};

// Cache for memoized results to ensure same content returns same object reference
const valuesCache = new Map<
  string,
  { fields: Record<string, FieldState>; result: Record<string, unknown> }
>();
const fieldErrorsCache = new Map<
  string,
  { fields: Record<string, FieldState>; result: Record<string, string> }
>();
const formStateCache = new Map<
  string,
  { form: FormState | undefined; result: PartialFormState }
>();

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
  const form = state.forms[formId];

  if (!form) return EMPTY_FIELD_ERRORS;

  // Check if there are actually any errors before creating a new object
  const hasErrors = Object.values(form.fields).some(field => field?.error);

  if (!hasErrors) {
    return EMPTY_FIELD_ERRORS; // Return the same empty object reference
  }

  // Check cache for memoization
  const cached = fieldErrorsCache.get(formId);

  if (cached && cached.fields === form.fields) {
    return cached.result;
  }

  // Create new result
  const result = Object.keys(form.fields).reduce<Record<string, string>>(
    (acc, fieldName) => {
      const field = form.fields[fieldName];

      if (field?.error) {
        acc[fieldName] = field.error;
      }

      return acc;
    },
    {}
  );

  // Cache the result
  fieldErrorsCache.set(formId, { fields: form.fields, result });

  return result;
};

export const selectFormState = (
  state: FormsState,
  formId: string
): PartialFormState | undefined => {
  const form = state.forms[formId];

  // Cache this result based on form reference
  const cacheKey = `formState-${formId}`;
  const cached = formStateCache.get(cacheKey);

  if (cached && cached.form === form) {
    return cached.result;
  }

  // Create new result
  const result: PartialFormState = {
    isSubmitting: form?.isSubmitting || false,
    isSubmitted: form?.isSubmitted || false,
    isValid: form?.isValid || true,
    isDirty: form?.isDirty || false,
    isValidating: form?.isValidating || false,
    error: form?.error,
    fieldErrors: selectFormFieldErrors(state, formId),
  };

  // Cache the result
  formStateCache.set(cacheKey, { form, result });

  return result;
};

export const selectFormValues = (state: FormsState, formId: string) => {
  const form = state.forms[formId];

  if (!form) return EMPTY_VALUES;

  // Check if there are actually any fields before creating a new object
  const fieldNames = Object.keys(form.fields);

  if (fieldNames.length === 0) {
    return EMPTY_VALUES; // Return the same empty object reference
  }

  // Check cache for memoization
  const cached = valuesCache.get(formId);

  if (cached && cached.fields === form.fields) {
    return cached.result;
  }

  // Create new result
  const result = fieldNames.reduce(
    (acc, fieldName) => {
      acc[fieldName] = form.fields[fieldName]?.value;

      return acc;
    },
    {} as Record<string, unknown>
  );

  // Cache the result
  valuesCache.set(formId, { fields: form.fields, result });

  return result;
};

export const selectFormErrors = (state: FormsState, formId: string) => {
  const form = state.forms[formId];

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
export const selectSubmitForm = (state: FormsState) => state.submitForm;
export const selectRegisterField = (state: FormsState) => state.registerField;
export const selectSetFieldValue = (state: FormsState) => state.setFieldValue;
export const selectSetFieldTouched = (state: FormsState) =>
  state.setFieldTouched;
export const selectSetFieldError = (state: FormsState) => state.setFieldError;
export const selectValidateForm = (state: FormsState) => state.validateForm;
export const selectValidateField = (state: FormsState) => state.validateField;
