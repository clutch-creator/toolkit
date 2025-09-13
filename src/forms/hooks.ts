import { useEffect } from 'react';
import { create } from 'zustand';

type ValidationRule = {
  required?: boolean | string;
  pattern?: RegExp | { value: RegExp; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  validate?:
    | ((value: any) => string | boolean | undefined)
    | Record<string, (value: any) => string | boolean | undefined>;
};

type FieldState = {
  value: any;
  error?: string;
  errors?: string[];
  touched?: boolean;
  dirty?: boolean;
  isValid?: boolean;
  isValidating?: boolean;
  rules?: ValidationRule;
  defaultValue?: any;
};

type FormMode = 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';

type FormState = {
  fields: Record<string, FieldState>;
  isSubmitting?: boolean;
  isSubmitted?: boolean;
  isSubmitSuccessful?: boolean;
  submitCount?: number;
  isValid?: boolean;
  isValidating?: boolean;
  isDirty?: boolean;
  dirtyFields?: Record<string, boolean>;
  touchedFields?: Record<string, boolean>;
  errors?: Record<string, any>;
  defaultValues?: Record<string, any>;
  mode?: FormMode;
  reValidateMode?: FormMode;
  shouldFocusError?: boolean;
};

type SubmitHandler<T = Record<string, any>> = (
  data: T,
  event?: React.BaseSyntheticEvent
) => void | Promise<void>;
type SubmitErrorHandler<T = Record<string, any>> = (
  errors: Record<string, any>,
  event?: React.BaseSyntheticEvent
) => void | Promise<void>;

type FormsStore = {
  forms: Record<string, FormState>;

  // Form management
  createForm: (formId: string, options?: Partial<FormState>) => void;
  destroyForm: (formId: string) => void;
  resetForm: (formId: string, values?: Record<string, any>) => void;

  // Field registration and management
  registerField: (
    formId: string,
    fieldName: string,
    config?: Partial<FieldState>
  ) => void;
  unregisterField: (formId: string, fieldName: string) => void;

  // Value management
  setFieldValue: (
    formId: string,
    fieldName: string,
    value: any,
    options?: {
      shouldValidate?: boolean;
      shouldTouch?: boolean;
      shouldDirty?: boolean;
    }
  ) => void;
  setValue: (formId: string, values: Record<string, any>) => void;
  getValues: (formId: string, fieldName?: string | string[]) => any;

  // Error management
  setFieldError: (
    formId: string,
    fieldName: string,
    error?: string | string[]
  ) => void;
  setError: (formId: string, errors: Record<string, any>) => void;
  clearErrors: (formId: string, fieldNames?: string | string[]) => void;

  // Validation
  validateField: (formId: string, fieldName: string) => Promise<boolean>;
  validateForm: (formId: string) => Promise<boolean>;
  trigger: (formId: string, fieldNames?: string | string[]) => Promise<boolean>;

  // Touch and dirty state
  setFieldTouched: (
    formId: string,
    fieldName: string,
    touched?: boolean
  ) => void;
  setFieldDirty: (formId: string, fieldName: string, dirty?: boolean) => void;

  // Form state
  setFormState: (formId: string, state: Partial<FormState>) => void;
};

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
        value: existingField?.value ?? defaultValue,
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

  // Value management
  setFieldValue: (formId, fieldName, value, options = {}) => {
    const {
      shouldValidate = false,
      shouldTouch = false,
      shouldDirty = true,
    } = options;

    set(state => {
      const form = state.forms[formId];

      if (!form || !form.fields[fieldName]) return state;

      const field = form.fields[fieldName];
      const isDirty = shouldDirty && value !== field.defaultValue;

      const updatedField = {
        ...field,
        value,
        dirty: isDirty,
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
          [fieldName]: isDirty,
        },
        touchedFields: shouldTouch
          ? {
              ...form.touchedFields,
              [fieldName]: true,
            }
          : form.touchedFields,
        isDirty:
          isDirty ||
          Object.values({ ...form.dirtyFields, [fieldName]: isDirty }).some(
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
      get().setFieldValue(formId, fieldName, value, { shouldValidate: false });
    });
  },

  getValues: (formId, fieldName) => {
    const form = get().forms[formId];

    if (!form) return undefined;

    if (typeof fieldName === 'string') {
      return form.fields[fieldName]?.value;
    }

    if (Array.isArray(fieldName)) {
      const result: Record<string, any> = {};

      fieldName.forEach(name => {
        result[name] = form.fields[name]?.value;
      });

      return result;
    }

    // Return all values
    const result: Record<string, any> = {};

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
      const errors = Array.isArray(error) ? error : error ? [error] : undefined;
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
              [fieldName]: errorString,
            },
            isValid:
              !errorString &&
              Object.values({
                ...form.errors,
                [fieldName]: errorString,
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

          if (!pattern.test(value)) {
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
            for (const [key, validator] of Object.entries(rules.validate)) {
              const result = await validator(value);

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
  }, [formId, store]);

  const form = store.forms[formId] || {
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
        const values = store.getValues(formId);

        try {
          await onValid(values, event as React.BaseSyntheticEvent);
          store.setFormState(formId, {
            isSubmitting: false,
            isSubmitted: true,
            isSubmitSuccessful: true,
          });
        } catch (error) {
          store.setFormState(formId, {
            isSubmitting: false,
            isSubmitted: true,
            isSubmitSuccessful: false,
          });
          throw error;
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

    // Field registration
    register: (fieldName: string, rules?: ValidationRule) => {
      store.registerField(formId, fieldName, { rules });

      const field = form.fields[fieldName] || {
        value: '',
        error: undefined,
        touched: false,
      };

      return {
        name: fieldName,
        onChange: (event: React.ChangeEvent<HTMLInputElement> | any) => {
          const value = event?.target ? event.target.value : event;

          store.setFieldValue(formId, fieldName, value, {
            shouldValidate:
              form.mode === 'onChange' ||
              (form.reValidateMode === 'onChange' && field.touched),
            shouldTouch: form.mode === 'onTouched',
          });
        },
        onBlur: () => {
          store.setFieldTouched(formId, fieldName, true);
          if (form.mode === 'onBlur' || form.reValidateMode === 'onBlur') {
            store.validateField(formId, fieldName);
          }
        },
        value: field.value,
        ref: (element: HTMLElement | null) => {
          // Focus management for errors
          if (form.shouldFocusError && field.error && element) {
            element.focus();
          }
        },
      };
    },

    // Methods
    handleSubmit,
    reset: (values?: Record<string, any>) => store.resetForm(formId, values),
    setValue: (
      fieldName: string,
      value: any,
      options?: Parameters<typeof store.setFieldValue>[3]
    ) => store.setFieldValue(formId, fieldName, value, options),
    getValue: (fieldName: string) => store.getValues(formId, fieldName),
    getValues: () => store.getValues(formId),
    setError: (fieldName: string, error: string | string[]) =>
      store.setFieldError(formId, fieldName, error),
    clearErrors: (fieldNames?: string | string[]) =>
      store.clearErrors(formId, fieldNames),
    trigger: (fieldNames?: string | string[]) =>
      store.trigger(formId, fieldNames),
    unregister: (fieldName: string) => store.unregisterField(formId, fieldName),

    // Form control methods
    setFocus: (fieldName: string) => {
      const element = document.querySelector(
        `[name="${fieldName}"]`
      ) as HTMLElement;

      element?.focus();
    },
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
  }, [formId, fieldName, store]);

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

  const setValue = (
    value: any,
    options?: Parameters<typeof store.setFieldValue>[3]
  ) => {
    store.setFieldValue(formId, fieldName, value, options);
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
      onChange: (event: React.ChangeEvent<HTMLInputElement> | any) => {
        const value = event?.target ? event.target.value : event;
        const shouldValidate =
          form?.mode === 'onChange' ||
          (form?.reValidateMode === 'onChange' && field.touched);

        setValue(value, {
          shouldValidate,
          shouldTouch: form?.mode === 'onTouched',
        });
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

// Additional utility hooks

export function useWatch(formId: string, name?: string | string[]) {
  const store = useFormsStore();
  const form = store.forms[formId];

  if (!form) return undefined;

  if (typeof name === 'string') {
    return form.fields[name]?.value;
  } else if (Array.isArray(name)) {
    const result: Record<string, any> = {};

    name.forEach(fieldName => {
      result[fieldName] = form.fields[fieldName]?.value;
    });

    return result;
  }

  // Return all values
  const result: Record<string, any> = {};

  Object.keys(form.fields).forEach(fieldName => {
    result[fieldName] = form.fields[fieldName]?.value;
  });

  return result;
}

export function useFormState(formId: string) {
  const store = useFormsStore();
  const form = store.forms[formId];

  return {
    isDirty: form?.isDirty || false,
    isLoading: form?.isValidating || false,
    isSubmitted: form?.isSubmitted || false,
    isSubmitting: form?.isSubmitting || false,
    isSubmitSuccessful: form?.isSubmitSuccessful || false,
    isValid: form?.isValid || true,
    isValidating: form?.isValidating || false,
    submitCount: form?.submitCount || 0,
    dirtyFields: form?.dirtyFields || {},
    touchedFields: form?.touchedFields || {},
    errors: form?.errors || {},
  };
}

export function useFormContext(formId: string) {
  return useForm(formId);
}

// Field Array utilities (for dynamic forms)
export function useFieldArray(formId: string, name: string) {
  const store = useFormsStore();
  const form = store.forms[formId];
  const value = form?.fields[name]?.value || [];

  const append = (item: any) => {
    const currentArray = Array.isArray(value) ? value : [];

    store.setFieldValue(formId, name, [...currentArray, item]);
  };

  const prepend = (item: any) => {
    const currentArray = Array.isArray(value) ? value : [];

    store.setFieldValue(formId, name, [item, ...currentArray]);
  };

  const insert = (index: number, item: any) => {
    const currentArray = Array.isArray(value) ? value : [];
    const newArray = [...currentArray];

    newArray.splice(index, 0, item);
    store.setFieldValue(formId, name, newArray);
  };

  const remove = (index: number) => {
    const currentArray = Array.isArray(value) ? value : [];
    const newArray = currentArray.filter((_, i) => i !== index);

    store.setFieldValue(formId, name, newArray);
  };

  const move = (from: number, to: number) => {
    const currentArray = Array.isArray(value) ? value : [];
    const newArray = [...currentArray];
    const [removed] = newArray.splice(from, 1);

    newArray.splice(to, 0, removed);
    store.setFieldValue(formId, name, newArray);
  };

  const swap = (indexA: number, indexB: number) => {
    const currentArray = Array.isArray(value) ? value : [];
    const newArray = [...currentArray];

    [newArray[indexA], newArray[indexB]] = [newArray[indexB], newArray[indexA]];
    store.setFieldValue(formId, name, newArray);
  };

  const update = (index: number, item: any) => {
    const currentArray = Array.isArray(value) ? value : [];
    const newArray = [...currentArray];

    newArray[index] = item;
    store.setFieldValue(formId, name, newArray);
  };

  const replace = (items: any[]) => {
    store.setFieldValue(formId, name, items);
  };

  return {
    fields: Array.isArray(value)
      ? value.map((item, index) => ({
          ...item,
          id: `${name}.${index}`,
          key: `${name}.${index}`,
        }))
      : [],
    append,
    prepend,
    insert,
    remove,
    move,
    swap,
    update,
    replace,
  };
}
