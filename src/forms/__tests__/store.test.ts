import { beforeEach, describe, expect, it } from 'bun:test';
import { useFormsStore } from '../store.js';

describe('Forms Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useFormsStore.setState({ forms: {} });
  });

  describe('Form Management', () => {
    it('should create a form with default state', () => {
      const store = useFormsStore.getState();

      store.createForm('test-form');

      const state = useFormsStore.getState();
      const form = state.forms['test-form'];

      expect(form).toBeDefined();
      expect(form.isSubmitting).toBe(false);
      expect(form.isValid).toBe(true);
      expect(form.isDirty).toBe(false);
      expect(form.mode).toBe('onSubmit');
    });

    it('should create a form with custom options', () => {
      const store = useFormsStore.getState();

      store.createForm('test-form', {
        mode: 'onChange',
        shouldFocusError: false,
        defaultValues: { name: 'John' },
      });

      const state = useFormsStore.getState();
      const form = state.forms['test-form'];

      expect(form.mode).toBe('onChange');
      expect(form.shouldFocusError).toBe(false);
      expect(form.defaultValues).toEqual({ name: 'John' });
    });

    it('should destroy a form', () => {
      const store = useFormsStore.getState();

      store.createForm('test-form');

      let state = useFormsStore.getState();

      expect(state.forms['test-form']).toBeDefined();

      store.destroyForm('test-form');

      state = useFormsStore.getState();
      expect(state.forms['test-form']).toBeUndefined();
    });

    it('should reset a form', () => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
      store.registerField('test-form', 'name', { defaultValue: 'John' });
      store.setFieldValue('test-form', 'name', 'Jane');

      // Field should be dirty and have updated value
      let state = useFormsStore.getState();

      expect(state.forms['test-form'].fields.name.value).toBe('Jane');
      expect(state.forms['test-form'].fields.name.dirty).toBe(true);

      // Reset form
      store.resetForm('test-form', { name: 'Bob' });

      state = useFormsStore.getState();
      expect(state.forms['test-form'].fields.name.value).toBe('Bob');
      expect(state.forms['test-form'].fields.name.dirty).toBe(false);
      expect(state.forms['test-form'].isDirty).toBe(false);
    });
  });

  describe('Field Registration', () => {
    beforeEach(() => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
    });

    it('should register a field with default state', () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'name');

      const state = useFormsStore.getState();
      const field = state.forms['test-form'].fields.name;

      expect(field).toBeDefined();
      expect(field.value).toBe('');
      expect(field.touched).toBe(false);
      expect(field.dirty).toBe(false);
      expect(field.isValid).toBe(true);
    });

    it('should register a field with custom config', () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'name', {
        defaultValue: 'John',
        rules: { required: true },
      });

      const state = useFormsStore.getState();
      const field = state.forms['test-form'].fields.name;

      expect(field.defaultValue).toBe('John');
      expect(field.value).toBe('John');
      expect(field.rules?.required).toBe(true);
    });

    it('should unregister a field', () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'name');

      let state = useFormsStore.getState();

      expect(state.forms['test-form'].fields.name).toBeDefined();

      store.unregisterField('test-form', 'name');

      state = useFormsStore.getState();
      expect(state.forms['test-form'].fields.name).toBeUndefined();
    });
  });

  describe('Value Management', () => {
    beforeEach(() => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
      store.registerField('test-form', 'name', { defaultValue: 'John' });
    });

    it('should set field value', () => {
      const store = useFormsStore.getState();

      store.setFieldValue('test-form', 'name', 'Jane');

      const state = useFormsStore.getState();
      const field = state.forms['test-form'].fields.name;

      expect(field.value).toBe('Jane');
    });

    it('should mark field as dirty when value differs from default', () => {
      const store = useFormsStore.getState();

      store.setFieldValue('test-form', 'name', 'Jane');

      const state = useFormsStore.getState();
      const field = state.forms['test-form'].fields.name;

      expect(field.dirty).toBe(true);
    });

    it('should not mark field as dirty when value equals default', () => {
      const store = useFormsStore.getState();

      store.setFieldValue('test-form', 'name', 'John'); // Same as default

      const state = useFormsStore.getState();
      const field = state.forms['test-form'].fields.name;

      expect(field.dirty).toBe(false);
    });

    it('should update form isDirty based on field states', () => {
      const store = useFormsStore.getState();

      // Form should not be dirty initially
      let state = useFormsStore.getState();

      expect(state.forms['test-form'].isDirty).toBe(false);

      // Set field value to different from default
      store.setFieldValue('test-form', 'name', 'Jane');

      state = useFormsStore.getState();
      expect(state.forms['test-form'].isDirty).toBe(true);
    });

    it('should set multiple values', () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'email', { defaultValue: '' });
      store.setValue('test-form', { name: 'Jane', email: 'jane@example.com' });

      const state = useFormsStore.getState();
      const form = state.forms['test-form'];

      expect(form.fields.name.value).toBe('Jane');
      expect(form.fields.email.value).toBe('jane@example.com');
    });

    it('should get field values', () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'email', {
        defaultValue: 'test@example.com',
      });
      store.setFieldValue('test-form', 'name', 'Jane');

      // Get single field
      const name = store.getValues('test-form', 'name');

      expect(name).toBe('Jane');

      // Get multiple fields
      const values = store.getValues('test-form', ['name', 'email']);

      expect(values).toEqual({ name: 'Jane', email: 'test@example.com' });

      // Get all fields
      const allValues = store.getValues('test-form');

      expect(allValues).toEqual({ name: 'Jane', email: 'test@example.com' });
    });
  });

  describe('Error Management', () => {
    beforeEach(() => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
      store.registerField('test-form', 'name');
    });

    it('should set field error', () => {
      const store = useFormsStore.getState();

      store.setFieldError('test-form', 'name', 'This field is required');

      const state = useFormsStore.getState();
      const field = state.forms['test-form'].fields.name;

      expect(field.error).toBe('This field is required');
      expect(field.errors).toEqual(['This field is required']);
      expect(field.isValid).toBe(false);
    });

    it('should clear field error', () => {
      const store = useFormsStore.getState();

      store.setFieldError('test-form', 'name', 'This field is required');

      let state = useFormsStore.getState();

      expect(state.forms['test-form'].fields.name.error).toBe(
        'This field is required'
      );

      store.setFieldError('test-form', 'name', undefined);

      state = useFormsStore.getState();
      expect(state.forms['test-form'].fields.name.error).toBeUndefined();
      expect(state.forms['test-form'].fields.name.isValid).toBe(true);
    });

    it('should update form validity based on field errors', () => {
      const store = useFormsStore.getState();

      // Form should be valid initially
      let state = useFormsStore.getState();

      expect(state.forms['test-form'].isValid).toBe(true);

      // Set error on field
      store.setFieldError('test-form', 'name', 'This field is required');

      state = useFormsStore.getState();
      expect(state.forms['test-form'].isValid).toBe(false);
    });

    it('should set multiple errors at once', () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'email');
      store.setError('test-form', {
        name: 'Name is required',
        email: 'Email is invalid',
      });

      const state = useFormsStore.getState();
      const form = state.forms['test-form'];

      expect(form.fields.name.error).toBe('Name is required');
      expect(form.fields.email.error).toBe('Email is invalid');
    });

    it('should clear errors', () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'email');

      store.setError('test-form', {
        name: 'Name is required',
        email: 'Email is invalid',
      });

      // Clear specific field error
      store.clearErrors('test-form', 'name');

      let state = useFormsStore.getState();

      expect(state.forms['test-form'].fields.name.error).toBeUndefined();
      expect(state.forms['test-form'].fields.email.error).toBe(
        'Email is invalid'
      );

      // Clear all errors
      store.clearErrors('test-form');

      state = useFormsStore.getState();
      expect(state.forms['test-form'].fields.name.error).toBeUndefined();
      expect(state.forms['test-form'].fields.email.error).toBeUndefined();
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
    });

    it('should validate required fields', async () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'name', {
        rules: { required: true, requiredMessage: 'Name is required' },
      });

      const isValid = await store.validateField('test-form', 'name');

      expect(isValid).toBe(false);

      const state = useFormsStore.getState();

      expect(state.forms['test-form'].fields.name.error).toBe(
        'Name is required'
      );
    });

    it('should validate pattern rules', async () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'email', {
        rules: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          patternMessage: 'Invalid email format',
        },
      });
      store.setFieldValue('test-form', 'email', 'invalid-email');

      const isValid = await store.validateField('test-form', 'email');

      expect(isValid).toBe(false);

      const state = useFormsStore.getState();

      expect(state.forms['test-form'].fields.email.error).toBe(
        'Invalid email format'
      );
    });

    it('should validate entire form', async () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'name', { rules: { required: true } });
      store.registerField('test-form', 'email', { rules: { required: true } });

      const isValid = await store.validateForm('test-form');

      expect(isValid).toBe(false);

      const state = useFormsStore.getState();

      expect(state.forms['test-form'].isValid).toBe(false);
    });

    it('should trigger validation with different parameters', async () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'name', { rules: { required: true } });
      store.registerField('test-form', 'email', { rules: { required: true } });

      // Trigger single field
      const singleFieldValid = await store.trigger('test-form', 'name');

      expect(singleFieldValid).toBe(false);

      // Trigger multiple fields
      const multipleFieldsValid = await store.trigger('test-form', [
        'name',
        'email',
      ]);

      expect(multipleFieldsValid).toBe(false);

      // Trigger entire form
      const formValid = await store.trigger('test-form');

      expect(formValid).toBe(false);
    });
  });

  describe('Touch and Dirty State', () => {
    beforeEach(() => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
      store.registerField('test-form', 'name');
    });

    it('should set field touched state', () => {
      const store = useFormsStore.getState();

      store.setFieldTouched('test-form', 'name', true);

      const state = useFormsStore.getState();

      expect(state.forms['test-form'].fields.name.touched).toBe(true);
    });

    it('should set field dirty state', () => {
      const store = useFormsStore.getState();

      store.setFieldDirty('test-form', 'name', true);

      const state = useFormsStore.getState();

      expect(state.forms['test-form'].fields.name.dirty).toBe(true);
    });
  });

  describe('Internal Helpers', () => {
    beforeEach(() => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
      store.registerField('test-form', 'name');
    });

    it('should determine if field should validate on change', () => {
      const store = useFormsStore.getState();

      // Default mode is onSubmit - should not validate on change
      expect(store._shouldValidateOnChange('test-form', 'name')).toBe(false);

      // Set mode to onChange
      store.setFormState('test-form', { mode: 'onChange' });
      expect(store._shouldValidateOnChange('test-form', 'name')).toBe(true);
    });

    it('should determine if field should touch on change', () => {
      const store = useFormsStore.getState();

      // Default mode is onSubmit - should not touch on change
      expect(store._shouldTouchOnChange('test-form', 'name')).toBe(false);

      // Set mode to onTouched
      store.setFormState('test-form', { mode: 'onTouched' });
      expect(store._shouldTouchOnChange('test-form', 'name')).toBe(true);
    });

    it('should determine if field should be marked dirty', () => {
      const store = useFormsStore.getState();

      store.registerField('test-form', 'name', { defaultValue: 'John' });

      // Different value should be dirty
      expect(store._shouldMarkDirty('test-form', 'name', 'Jane')).toBe(true);

      // Same value should not be dirty
      expect(store._shouldMarkDirty('test-form', 'name', 'John')).toBe(false);
    });
  });
});
