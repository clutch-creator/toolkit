export type BaseValidationRule = {
  required?: boolean;
  requiredMessage?: string;
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
};

export type NumberValidationRule = {
  min?: number;
  minMessage?: string;
  max?: number;
  maxMessage?: string;
};

export type TextValidationRule = {
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  pattern?: RegExp;
  patternMessage?: string;
};

export type ValidationRule = BaseValidationRule &
  NumberValidationRule &
  TextValidationRule;

export type FieldState = {
  value: unknown;
  error?: string;
  errors?: string[];
  touched?: boolean;
  dirty?: boolean;
  isValid?: boolean;
  isValidating?: boolean;
  rules?: ValidationRule;
  defaultValue?: unknown;
};

export type FormMode = 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';

export type FormState = {
  fields: Record<string, FieldState>;
  isSubmitting?: boolean;
  isSubmitted?: boolean;
  isSubmitSuccessful?: boolean;
  submitCount?: number;
  isValid?: boolean;
  isValidating?: boolean;
  isDirty?: boolean;
  errors?: Record<string, string>;
  defaultValues?: Record<string, unknown>;
  mode?: FormMode;
  reValidateMode?: FormMode;
  shouldFocusError?: boolean;
  submitOnChange?: boolean;
  debounceTime?: number;
  onSubmit?: (
    values: Record<string, unknown>,
    event?: React.FormEvent
  ) => void | Promise<void>;
};

export type SubmitHandler<T = Record<string, unknown>> = (
  data: T,
  event?: React.BaseSyntheticEvent
) => void | Promise<void>;

export type SubmitErrorHandler = (
  errors: Record<string, string>,
  event?: React.BaseSyntheticEvent
) => void | Promise<void>;

export type FormsStore = {
  forms: Record<string, FormState>;

  // Form management
  createForm: (formId: string, options?: Partial<FormState>) => void;
  destroyForm: (formId: string) => void;
  resetForm: (formId: string, values?: Record<string, unknown>) => void;

  // Field registration and management
  registerField: (
    formId: string,
    fieldName: string,
    config?: Partial<FieldState>
  ) => void;
  unregisterField: (formId: string, fieldName: string) => void;

  // Value management (no longer need options - determined by form config)
  setFieldValue: (formId: string, fieldName: string, value: unknown) => void;
  setValue: (formId: string, values: Record<string, unknown>) => void;
  getValues: (formId: string, fieldName?: string | string[]) => unknown;

  // Error management
  setFieldError: (
    formId: string,
    fieldName: string,
    error?: string | string[]
  ) => void;
  setError: (formId: string, errors: Record<string, string>) => void;
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

  // Internal utilities
  _shouldValidateOnChange: (formId: string, fieldName: string) => boolean;
  _shouldTouchOnChange: (formId: string, fieldName: string) => boolean;
  _shouldMarkDirty: (
    formId: string,
    fieldName: string,
    value: unknown
  ) => boolean;
  _handleSubmitOnChange: (formId: string) => void;
};
