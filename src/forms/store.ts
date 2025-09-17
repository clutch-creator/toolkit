import { create } from 'zustand';
import {
  selectFormValues,
  shouldFieldTouchOnChange,
  shouldFieldValidateOnChange,
} from './selectors.js';
import type { FieldState, FormsStore, FormState } from './types.js';

// Module-level debounce timers - no need to be in store state
const formsDebounceTimers: Record<string, NodeJS.Timeout> = {};

const DEFAULT_FORM_STATE: FormState = {
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
  mode: 'onSubmit',
  reValidateMode: 'onChange',
  shouldFocusError: true,
};

const getForm = (
  forms: FormsStore['forms'],
  formId: string,
  initialState?: Partial<FormState>
): FormState => {
  const form = forms[formId];

  if (!form) {
    return {
      ...DEFAULT_FORM_STATE,
      ...initialState,
    };
  }

  return {
    ...DEFAULT_FORM_STATE,
    ...form,
    ...initialState,
  };
};

export const useFormsStore = create<FormsStore>((set, get) => ({
  forms: {},

  // Form management
  createForm: (formId, options = {}) => {
    const newForm = getForm(get().forms, formId, options);

    set(state => ({
      forms: {
        ...state.forms,
        [formId]: newForm,
      },
    }));
  },

  destroyForm: formId => {
    // Clean up debounce timer if it exists
    if (formsDebounceTimers[formId]) {
      clearTimeout(formsDebounceTimers[formId]);
      delete formsDebounceTimers[formId];
    }

    set(state => {
      const { [formId]: removedForm, ...remainingForms } = state.forms;

      return {
        forms: remainingForms,
      };
    });
  },

  resetForm: (formId, values = {}) => {
    set(state => {
      const form = state.forms[formId];

      if (!form) return state;

      const resetFields: Record<string, FieldState> = {};

      Object.keys(form.fields).forEach(fieldName => {
        const field = form.fields[fieldName];
        const newDefaultValue = values[fieldName] ?? field.defaultValue;

        resetFields[fieldName] = {
          ...field,
          value: newDefaultValue,
          defaultValue: newDefaultValue,
          error: undefined,
          errors: undefined,
          touched: false,
          dirty: false,
          isValid: true,
          isValidating: false,
        };
      });

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: resetFields,
            isSubmitting: false,
            isSubmitted: false,
            isSubmitSuccessful: false,
            submitCount: 0,
            isValid: true,
            isValidating: false,
            isDirty: false,
            errors: {},
            defaultValues: { ...form.defaultValues, ...values },
          },
        },
      };
    });
  },

  // Field registration
  registerField: (formId, fieldName, config = {}) => {
    set(state => {
      const form = getForm(state.forms, formId);

      const existingField = form.fields[fieldName];
      const defaultValue =
        config.defaultValue ?? existingField?.defaultValue ?? '';

      const newField = {
        error: undefined,
        errors: undefined,
        touched: false,
        dirty: false,
        isValid: true,
        isValidating: false,
        defaultValue,
        ...existingField,
        ...config,
      };

      // Ensure value is set to defaultValue if not provided
      if (newField.value === undefined) {
        newField.value = defaultValue;
      }

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: {
              ...form.fields,
              [fieldName]: newField,
            },
          },
        },
      };
    });
  },

  unregisterField: (formId, fieldName) => {
    set(state => {
      const form = state.forms[formId];

      if (!form) return state;

      const { [fieldName]: removedField, ...remainingFields } = form.fields;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: remainingFields,
          },
        },
      };
    });
  },

  // Value management - now uses form configuration internally
  setFieldValue: (formId, fieldName, value) => {
    const state = get();
    const shouldValidate = shouldFieldValidateOnChange(
      state,
      formId,
      fieldName
    );
    const shouldTouch = shouldFieldTouchOnChange(state, formId);

    set(state => {
      const form = state.forms[formId];

      if (!form || !form.fields[fieldName]) return state;

      const field = form.fields[fieldName];

      const updatedField = {
        ...field,
        value,
        dirty: value !== field.defaultValue,
        touched: shouldTouch || field.touched,
      };

      const updatedFields = {
        ...form.fields,
        [fieldName]: updatedField,
      };

      // Derive isDirty from individual field states
      const isDirty = Object.values(updatedFields).some(f => f.dirty);

      const updatedForm = {
        ...form,
        fields: updatedFields,
        isDirty,
      };

      return {
        forms: {
          ...state.forms,
          [formId]: updatedForm,
        },
      };
    });

    if (shouldValidate) {
      get().validateField(formId, fieldName);
    }

    // Handle submit on change
    const form = get().forms[formId];

    if (form?.submitOnChange && form.isDirty && form.onSubmit) {
      get()._handleSubmitOnChange(formId);
    }
  },

  _handleSubmitOnChange: (formId: string) => {
    const state = get();
    const form = state.forms[formId];

    if (!form?.onSubmit || !form.submitOnChange) return;

    const debounceTime = form.debounceTime || 300;

    // Clear existing timer
    if (formsDebounceTimers[formId]) {
      clearTimeout(formsDebounceTimers[formId]);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        // Use the centralized submitForm action
        await get().submitForm(formId);
      } catch (error) {
        // Submit on change failed - could be logged
        // eslint-disable-next-line no-console
        console.warn('Submit on change failed:', error);
      }

      // Clean up timer
      delete formsDebounceTimers[formId];
    }, debounceTime);

    // Store timer
    formsDebounceTimers[formId] = timer;
  },

  setValue: (formId, values) => {
    Object.entries(values).forEach(([fieldName, value]) => {
      get().setFieldValue(formId, fieldName, value);
    });
  },

  getValues: (formId, fieldName) => {
    const form = get().forms[formId];

    if (!form) return undefined;

    if (typeof fieldName === 'string') {
      return form.fields[fieldName]?.value;
    }

    if (Array.isArray(fieldName)) {
      const result: Record<string, unknown> = {};

      fieldName.forEach(name => {
        result[name] = form.fields[name]?.value;
      });

      return result;
    }

    // Return all values
    const result: Record<string, unknown> = {};

    Object.keys(form.fields).forEach(name => {
      result[name] = form.fields[name]?.value;
    });

    return result;
  },

  // Error management
  setFieldError: (formId, fieldName, error) => {
    set(state => {
      const form = state.forms[formId];

      if (!form || !form.fields[fieldName]) return state;

      const field = form.fields[fieldName];
      let errors: string[] | undefined;

      if (Array.isArray(error)) {
        errors = error;
      } else if (error) {
        errors = [error];
      } else {
        errors = undefined;
      }

      const errorString = Array.isArray(error) ? error[0] : error;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: {
              ...form.fields,
              [fieldName]: {
                ...field,
                error: errorString,
                errors,
                isValid: !errorString,
              },
            },
            errors: {
              ...form.errors,
              [fieldName]: errorString || '',
            },
            isValid:
              !errorString &&
              Object.values({
                ...form.errors,
                [fieldName]: errorString || '',
              }).every(err => !err),
          },
        },
      };
    });
  },

  setError: (formId, errors) => {
    Object.entries(errors).forEach(([fieldName, error]) => {
      get().setFieldError(formId, fieldName, error);
    });
  },

  clearErrors: (formId, fieldNames) => {
    if (typeof fieldNames === 'string') {
      get().setFieldError(formId, fieldNames, undefined);
    } else if (Array.isArray(fieldNames)) {
      fieldNames.forEach(name => get().setFieldError(formId, name, undefined));
    } else {
      // Clear all errors
      const form = get().forms[formId];

      if (form) {
        Object.keys(form.fields).forEach(name => {
          get().setFieldError(formId, name, undefined);
        });
      }
    }
  },

  // Validation
  validateField: async (formId, fieldName) => {
    const form = get().forms[formId];

    if (!form || !form.fields[fieldName]) return false;

    const field = form.fields[fieldName];
    const { rules } = field;
    const { value } = field;

    // Set validating state
    get().setFormState(formId, {
      fields: {
        ...form.fields,
        [fieldName]: { ...field, isValidating: true },
      },
    });

    let error: string | undefined;

    try {
      if (rules) {
        // Required validation
        if (rules.required) {
          const isEmpty =
            value === undefined ||
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0);

          if (isEmpty) {
            error = rules.requiredMessage || 'This field is required';
          }
        }

        // Pattern validation
        if (!error && rules.pattern && value) {
          if (!rules.pattern.test(String(value))) {
            error = rules.patternMessage || 'Invalid format';
          }
        }

        // Min/Max validation
        if (!error && typeof value === 'number') {
          if (rules.min !== undefined) {
            if (value < rules.min) {
              error = rules.minMessage || `Value must be at least ${rules.min}`;
            }
          }
          if (rules.max !== undefined) {
            if (value > rules.max) {
              error = rules.maxMessage || `Value must be at most ${rules.max}`;
            }
          }
        }

        // MinLength/MaxLength validation
        if (!error && typeof value === 'string') {
          if (rules.minLength !== undefined) {
            if (value.length < rules.minLength) {
              error =
                rules.minLengthMessage ||
                `Must be at least ${rules.minLength} characters long`;
            }
          }
          if (rules.maxLength !== undefined) {
            if (value.length > rules.maxLength) {
              error =
                rules.maxLengthMessage ||
                `Must be at most ${rules.maxLength} characters long`;
            }
          }
        }

        // Custom validation
        if (!error && rules.validate) {
          if (typeof rules.validate === 'function') {
            const result = await rules.validate(value);

            if (typeof result === 'string') {
              error = result;
            } else if (result === false) {
              error = 'Validation failed';
            }
          } else {
            // Multiple validators
            const validatorEntries = Object.entries(rules.validate);
            const validationPromises = validatorEntries.map(
              async ([key, validator]) => {
                try {
                  const result = await validator(value);

                  return { key, result };
                } catch {
                  return { key, result: false };
                }
              }
            );

            const results = await Promise.all(validationPromises);

            for (const { key, result } of results) {
              if (typeof result === 'string') {
                error = result;
                break;
              } else if (result === false) {
                error = `Validation failed: ${key}`;
                break;
              }
            }
          }
        }
      }
    } catch (validationError) {
      error = 'Validation error occurred';
    }

    // Update field with validation result
    get().setFieldError(formId, fieldName, error);

    // Clear validating state
    const updatedForm = get().forms[formId];

    if (updatedForm) {
      get().setFormState(formId, {
        fields: {
          ...updatedForm.fields,
          [fieldName]: {
            ...updatedForm.fields[fieldName],
            isValidating: false,
            isValid: !error,
          },
        },
      });
    }

    return !error;
  },

  validateForm: async formId => {
    const form = get().forms[formId];

    if (!form) return false;

    get().setFormState(formId, { isValidating: true });

    const validationPromises = Object.keys(form.fields).map(fieldName =>
      get().validateField(formId, fieldName)
    );

    const results = await Promise.all(validationPromises);
    const isValid = results.every(Boolean);

    get().setFormState(formId, {
      isValidating: false,
      isValid,
    });

    return isValid;
  },

  trigger: async (formId, fieldNames) => {
    if (typeof fieldNames === 'string') {
      return get().validateField(formId, fieldNames);
    } else if (Array.isArray(fieldNames)) {
      const results = await Promise.all(
        fieldNames.map(name => get().validateField(formId, name))
      );

      return results.every(Boolean);
    } else {
      return get().validateForm(formId);
    }
  },

  // Touch and dirty state
  setFieldTouched: (formId, fieldName, touched = true) => {
    set(state => {
      const form = state.forms[formId];

      if (!form || !form.fields[fieldName]) return state;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: {
              ...form.fields,
              [fieldName]: {
                ...form.fields[fieldName],
                touched,
              },
            },
          },
        },
      };
    });

    // Validate field if form mode is onBlur or all
    const form = get().forms[formId];

    if (touched && form && (form.mode === 'onBlur' || form.mode === 'all')) {
      get().validateField(formId, fieldName);
    }
  },

  setFieldDirty: (formId, fieldName, dirty = true) => {
    set(state => {
      const form = state.forms[formId];

      if (!form || !form.fields[fieldName]) return state;

      const updatedFields = {
        ...form.fields,
        [fieldName]: {
          ...form.fields[fieldName],
          dirty,
        },
      };

      // Derive isDirty from individual field states
      const isDirty = Object.values(updatedFields).some(f => f.dirty);

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: updatedFields,
            isDirty,
          },
        },
      };
    });
  },

  // Form state
  setFormState: (formId, state) => {
    set(storeState => ({
      forms: {
        ...storeState.forms,
        [formId]: {
          ...storeState.forms[formId],
          ...state,
        },
      },
    }));
  },

  // Form submission
  submitForm: async formId => {
    const form = get().forms[formId];

    console.log('Submitting form:', formId, form);

    if (!form) return;

    // Validate form before submitting
    const isValid = await get().validateForm(formId);

    console.log('Form valid:', isValid);

    if (!isValid) return;

    // Set submitting state
    get().setFormState(formId, {
      isSubmitting: true,
      isSubmitSuccessful: false,
      submitError: undefined,
      successMessage: undefined,
    });

    try {
      const values = selectFormValues(get(), formId);

      // Clear any existing field errors
      get().clearErrors(formId);

      const result = await form.onSubmit?.(values);

      console.log('Form submit result:', result);

      if (result && typeof result === 'object') {
        // Process each action response
        let hasError = false;
        let successMessage: string | undefined;

        for (const [_actionName, response] of Object.entries(result)) {
          if (response.error) {
            hasError = true;
            get().setFormState(formId, { error: response.error });
          }

          if (response.fieldErrors) {
            hasError = true;
            get().setError(formId, response.fieldErrors);
          }

          if (response.successMessage) {
            successMessage = response.successMessage;
          }
        }

        // Set final state
        get().setFormState(formId, {
          isSubmitting: false,
          isSubmitted: true,
          isSubmitSuccessful: !hasError,
          submitCount: (form.submitCount ?? 0) + 1,
          ...(successMessage && !hasError && { successMessage }),
        });
      } else {
        // Handle simple void response
        get().setFormState(formId, {
          isSubmitting: false,
          isSubmitted: true,
          isSubmitSuccessful: true,
          submitCount: (form.submitCount ?? 0) + 1,
        });
      }
    } catch (error) {
      // Handle thrown errors
      const errorMessage =
        error instanceof Error ? error.message : 'Submit failed';

      get().setFormState(formId, {
        isSubmitting: false,
        isSubmitted: true,
        isSubmitSuccessful: false,
        submitError: errorMessage,
        submitCount: (form.submitCount ?? 0) + 1,
      });
    }
  },
}));
