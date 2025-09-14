import { create } from 'zustand';
import type { FieldState, FormMode, FormsStore } from './types.js';

export const useFormsStore = create<FormsStore>((set, get) => ({
  forms: {},

  // Form management
  createForm: (formId, options = {}) => {
    set(state => ({
      forms: {
        ...state.forms,
        [formId]: {
          fields: {},
          isSubmitting: false,
          isSubmitted: false,
          isSubmitSuccessful: false,
          submitCount: 0,
          isValid: true,
          isValidating: false,
          isDirty: false,
          dirtyFields: {},
          touchedFields: {},
          errors: {},
          defaultValues: {},
          mode: 'onSubmit',
          reValidateMode: 'onChange',
          shouldFocusError: true,
          ...options,
        },
      },
    }));
  },

  destroyForm: formId => {
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

        resetFields[fieldName] = {
          ...field,
          value: values[fieldName] ?? field.defaultValue ?? '',
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
            dirtyFields: {},
            touchedFields: {},
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
      const form = state.forms[formId] || {
        fields: {},
        isSubmitting: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        submitCount: 0,
        isValid: true,
        isValidating: false,
        isDirty: false,
        dirtyFields: {},
        touchedFields: {},
        errors: {},
        defaultValues: {},
        mode: 'onSubmit' as FormMode,
        reValidateMode: 'onChange' as FormMode,
        shouldFocusError: true,
      };

      const existingField = form.fields[fieldName];
      const defaultValue =
        config.defaultValue ?? existingField?.defaultValue ?? '';

      form.fields[fieldName] = {
        error: undefined,
        errors: undefined,
        touched: false,
        dirty: false,
        isValid: true,
        isValidating: false,
        defaultValue,
        ...existingField,
        ...config,
        value: existingField?.value ?? defaultValue,
      };

      return {
        forms: {
          ...state.forms,
          [formId]: form,
        },
      };
    });
  },

  unregisterField: (formId, fieldName) => {
    set(state => {
      const form = state.forms[formId];

      if (!form) return state;

      const { [fieldName]: removedField, ...remainingFields } = form.fields;
      const { [fieldName]: removedDirty, ...remainingDirty } =
        form.dirtyFields || {};
      const { [fieldName]: removedTouched, ...remainingTouched } =
        form.touchedFields || {};
      const { [fieldName]: removedError, ...remainingErrors } =
        form.errors || {};

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: remainingFields,
            dirtyFields: remainingDirty,
            touchedFields: remainingTouched,
            errors: remainingErrors,
          },
        },
      };
    });
  },

  // Internal helper methods
  _shouldValidateOnChange: (formId, fieldName) => {
    const form = get().forms[formId];

    if (!form) return false;

    const field = form.fields[fieldName];

    if (!field) return false;

    return Boolean(
      form.mode === 'onChange' ||
        form.mode === 'all' ||
        (form.reValidateMode === 'onChange' && field.touched)
    );
  },

  _shouldTouchOnChange: (formId, _fieldName) => {
    const form = get().forms[formId];

    if (!form) return false;

    return form.mode === 'onTouched' || form.mode === 'all';
  },

  _shouldMarkDirty: (formId, fieldName, value) => {
    const form = get().forms[formId];

    if (!form) return true;

    const field = form.fields[fieldName];

    return value !== field?.defaultValue;
  },

  // Value management - now uses form configuration internally
  setFieldValue: (formId, fieldName, value) => {
    const shouldValidate = get()._shouldValidateOnChange(formId, fieldName);
    const shouldTouch = get()._shouldTouchOnChange(formId, fieldName);
    const shouldDirty = get()._shouldMarkDirty(formId, fieldName, value);

    set(state => {
      const form = state.forms[formId];

      if (!form || !form.fields[fieldName]) return state;

      const field = form.fields[fieldName];

      const updatedField = {
        ...field,
        value,
        dirty: shouldDirty,
        touched: shouldTouch || field.touched,
      };

      const updatedForm = {
        ...form,
        fields: {
          ...form.fields,
          [fieldName]: updatedField,
        },
        dirtyFields: {
          ...form.dirtyFields,
          [fieldName]: shouldDirty,
        },
        touchedFields: shouldTouch
          ? {
              ...form.touchedFields,
              [fieldName]: true,
            }
          : form.touchedFields,
        isDirty:
          shouldDirty ||
          Object.values({ ...form.dirtyFields, [fieldName]: shouldDirty }).some(
            Boolean
          ),
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
            error =
              typeof rules.required === 'string'
                ? rules.required
                : 'This field is required';
          }
        }

        // Pattern validation
        if (!error && rules.pattern && value) {
          const patternRule = rules.pattern;
          const pattern =
            patternRule instanceof RegExp ? patternRule : patternRule.value;

          if (!pattern.test(String(value))) {
            error =
              patternRule instanceof RegExp
                ? 'Invalid format'
                : patternRule.message;
          }
        }

        // Min/Max validation
        if (!error && typeof value === 'number') {
          if (rules.min !== undefined) {
            const min =
              typeof rules.min === 'object' ? rules.min.value : rules.min;

            if (value < min) {
              error =
                typeof rules.min === 'object'
                  ? rules.min.message
                  : `Minimum value is ${min}`;
            }
          }
          if (rules.max !== undefined) {
            const max =
              typeof rules.max === 'object' ? rules.max.value : rules.max;

            if (value > max) {
              error =
                typeof rules.max === 'object'
                  ? rules.max.message
                  : `Maximum value is ${max}`;
            }
          }
        }

        // MinLength/MaxLength validation
        if (!error && typeof value === 'string') {
          if (rules.minLength !== undefined) {
            const minLength =
              typeof rules.minLength === 'object'
                ? rules.minLength.value
                : rules.minLength;

            if (value.length < minLength) {
              error =
                typeof rules.minLength === 'object'
                  ? rules.minLength.message
                  : `Minimum length is ${minLength}`;
            }
          }
          if (rules.maxLength !== undefined) {
            const maxLength =
              typeof rules.maxLength === 'object'
                ? rules.maxLength.value
                : rules.maxLength;

            if (value.length > maxLength) {
              error =
                typeof rules.maxLength === 'object'
                  ? rules.maxLength.message
                  : `Maximum length is ${maxLength}`;
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
            touchedFields: {
              ...form.touchedFields,
              [fieldName]: touched,
            },
          },
        },
      };
    });
  },

  setFieldDirty: (formId, fieldName, dirty = true) => {
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
                dirty,
              },
            },
            dirtyFields: {
              ...form.dirtyFields,
              [fieldName]: dirty,
            },
            isDirty:
              dirty ||
              Object.values({ ...form.dirtyFields, [fieldName]: dirty }).some(
                Boolean
              ),
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
}));
