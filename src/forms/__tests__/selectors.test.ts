import { beforeEach, describe, expect, it } from 'bun:test';
import {
  selectField,
  selectFieldError,
  selectFieldState,
  selectFieldValue,
  selectForm,
  selectFormErrors,
  selectFormState,
  selectFormValues,
} from '../selectors.js';
import { useFormsStore } from '../store.js';

describe('Forms Selectors', () => {
  beforeEach(() => {
    // Reset store before each test
    useFormsStore.setState({ forms: {} });
  });

  beforeEach(() => {
    // Create a test form with some fields
    const { createForm, registerField, setFieldValue, setFieldError } =
      useFormsStore.getState();

    createForm('test-form');
    registerField('test-form', 'name', { defaultValue: 'John' });
    registerField('test-form', 'email', { defaultValue: 'john@example.com' });

    setFieldValue('test-form', 'name', 'Jane');
    setFieldError('test-form', 'email', 'Invalid email');
  });

  describe('Form Selectors', () => {
    it('should select form', () => {
      const state = useFormsStore.getState();
      const form = selectForm(state, 'test-form');

      expect(form).toBeDefined();
      expect(form.fields).toBeDefined();
      expect(form.fields.name).toBeDefined();
      expect(form.fields.email).toBeDefined();
    });

    it('should select form state', () => {
      const state = useFormsStore.getState();
      const formState = selectFormState(state, 'test-form');

      expect(formState).toBeDefined();
      expect(formState?.isSubmitting).toBe(false);
      // Form has an error set for email in setup; isValid should be false
      expect(formState?.isValid).toBe(false);
      expect(formState?.isDirty).toBe(true); // Should be dirty due to name change
    });

    it('should select form values', () => {
      const state = useFormsStore.getState();
      const values = selectFormValues(state, 'test-form');

      expect(values).toEqual({
        name: 'Jane',
        email: 'john@example.com',
      });
    });

    it('should select form errors', () => {
      const state = useFormsStore.getState();
      const errors = selectFormErrors(state, 'test-form');

      expect(errors).toEqual({
        email: 'Invalid email',
      });
    });

    it('should return empty objects for non-existent form', () => {
      const state = useFormsStore.getState();

      expect(selectForm(state, 'non-existent')).toBeUndefined();
      expect(selectFormState(state, 'non-existent')).toBeUndefined();
      expect(selectFormValues(state, 'non-existent')).toEqual({});
      expect(selectFormErrors(state, 'non-existent')).toEqual({});
    });
  });

  describe('Field Selectors', () => {
    it('should select field', () => {
      const state = useFormsStore.getState();
      const field = selectField(state, 'test-form', 'name');

      expect(field).toBeDefined();
      expect(field?.value).toBe('Jane');
      expect(field?.defaultValue).toBe('John');
      expect(field?.dirty).toBe(true);
    });

    it('should select field value', () => {
      const state = useFormsStore.getState();
      const value = selectFieldValue(state, 'test-form', 'name');

      expect(value).toBe('Jane');
    });

    it('should select field error', () => {
      const state = useFormsStore.getState();
      const error = selectFieldError(state, 'test-form', 'email');

      expect(error).toBe('Invalid email');
    });

    it('should select field state', () => {
      const state = useFormsStore.getState();
      const fieldState = selectFieldState(state, 'test-form', 'name');

      expect(fieldState).toEqual({
        value: 'Jane',
        error: undefined,
        touched: false,
        dirty: true,
        isValid: true,
        isValidating: false,
      });
    });

    it('should return default field state for non-existent field', () => {
      const state = useFormsStore.getState();
      const fieldState = selectFieldState(state, 'test-form', 'non-existent');

      expect(fieldState).toEqual({
        value: '',
        error: undefined,
        touched: false,
        dirty: false,
        isValid: true,
        isValidating: false,
      });
    });

    it('should return undefined for non-existent field in other selectors', () => {
      const state = useFormsStore.getState();

      expect(selectField(state, 'test-form', 'non-existent')).toBeUndefined();
      expect(
        selectFieldValue(state, 'test-form', 'non-existent')
      ).toBeUndefined();
      expect(
        selectFieldError(state, 'test-form', 'non-existent')
      ).toBeUndefined();
    });
  });
});
