import { beforeEach, describe, expect, it } from 'bun:test';
import { useFormsStore } from '../store.js';

describe('Forms Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useFormsStore.setState({ forms: {} });
  });

  describe('Form Management', () => {
    it('should create a form with default state', () => {
      useFormsStore.getState().createForm('test-form');

      const form = useFormsStore.getState().forms['test-form'];

      expect(form).toBeDefined();
      expect(form.isSubmitting).toBe(false);
      expect(form.isValid).toBe(true);
      expect(form.isDirty).toBe(false);
      expect(form.mode).toBe('onSubmit');
    });

    it('should create a form with custom options', () => {
      useFormsStore.getState().createForm('test-form', {
        mode: 'onChange',
        shouldFocusError: false,
        defaultValues: { name: 'John' },
      });

      const form = useFormsStore.getState().forms['test-form'];

      expect(form.mode).toBe('onChange');
      expect(form.shouldFocusError).toBe(false);
      expect(form.defaultValues).toEqual({ name: 'John' });
    });

    it('should destroy a form', () => {
      useFormsStore.getState().createForm('test-form');
      expect(useFormsStore.getState().forms['test-form']).toBeDefined();

      useFormsStore.getState().destroyForm('test-form');
      expect(useFormsStore.getState().forms['test-form']).toBeUndefined();
    });

    it('should reset a form', () => {
      useFormsStore.getState().createForm('test-form');
      useFormsStore
        .getState()
        .registerField('test-form', 'name', { defaultValue: 'John' });
      useFormsStore.getState().setFieldValue('test-form', 'name', 'Jane');
      useFormsStore.getState().setFieldError('test-form', 'name', 'Error');

      expect(
        useFormsStore.getState().forms['test-form'].fields.name.value
      ).toBe('Jane');
      expect(
        useFormsStore.getState().forms['test-form'].fields.name.error
      ).toBe('Error');

      useFormsStore.getState().resetForm('test-form');

      const form = useFormsStore.getState().forms['test-form'];

      expect(form.fields.name.value).toBe('John');
      expect(form.fields.name.error).toBeUndefined();
      expect(form.isDirty).toBe(false);
      expect(form.isValid).toBe(true);
    });
  });

  describe('Field Registration', () => {
    beforeEach(() => {
      useFormsStore.getState().createForm('test-form');
    });

    it('should register a field with default state', () => {
      useFormsStore.getState().registerField('test-form', 'name');

      const field = useFormsStore.getState().forms['test-form'].fields.name;

      expect(field).toBeDefined();
      expect(field.value).toBe('');
      expect(field.error).toBeUndefined();
      expect(field.touched).toBe(false);
      expect(field.dirty).toBe(false);
      expect(field.isValid).toBe(true);
    });

    it('should register a field with custom config', () => {
      useFormsStore.getState().registerField('test-form', 'name', {
        defaultValue: 'John',
        rules: { required: true },
      });

      const field = useFormsStore.getState().forms['test-form'].fields.name;

      expect(field.value).toBe('John');
      expect(field.rules?.required).toBe(true);
    });

    it('should preserve existing field value when re-registering', () => {
      useFormsStore
        .getState()
        .registerField('test-form', 'name', { defaultValue: 'John' });
      useFormsStore.getState().setFieldValue('test-form', 'name', 'Jane');

      expect(
        useFormsStore.getState().forms['test-form'].fields.name.value
      ).toBe('Jane');

      // Re-register with different default
      useFormsStore
        .getState()
        .registerField('test-form', 'name', { defaultValue: 'Bob' });

      expect(
        useFormsStore.getState().forms['test-form'].fields.name.value
      ).toBe('Jane'); // Preserved
    });
  });

  describe('Value Management', () => {
    beforeEach(() => {
      useFormsStore.getState().createForm('test-form');
      useFormsStore
        .getState()
        .registerField('test-form', 'name', { defaultValue: 'John' });
      useFormsStore
        .getState()
        .registerField('test-form', 'email', {
          defaultValue: 'john@example.com',
        });
    });

    it('should set field value', () => {
      useFormsStore.getState().setFieldValue('test-form', 'name', 'Jane');

      const field = useFormsStore.getState().forms['test-form'].fields.name;

      expect(field.value).toBe('Jane');
      expect(field.dirty).toBe(true);
    });

    it('should not mark field as dirty when value equals default', () => {
      useFormsStore.getState().setFieldValue('test-form', 'name', 'John'); // Same as default

      const field = useFormsStore.getState().forms['test-form'].fields.name;

      expect(field.value).toBe('John');
      expect(field.dirty).toBe(false);
    });

    it('should update form isDirty based on field states', () => {
      expect(useFormsStore.getState().forms['test-form'].isDirty).toBe(false);

      useFormsStore.getState().setFieldValue('test-form', 'name', 'Jane');
      expect(useFormsStore.getState().forms['test-form'].isDirty).toBe(true);

      useFormsStore.getState().setFieldValue('test-form', 'name', 'John'); // Back to default
      expect(useFormsStore.getState().forms['test-form'].isDirty).toBe(false);
    });

    it('should set multiple values', () => {
      useFormsStore
        .getState()
        .setValue('test-form', { name: 'Jane', email: 'jane@example.com' });

      const form = useFormsStore.getState().forms['test-form'];

      expect(form.fields.name.value).toBe('Jane');
      expect(form.fields.email.value).toBe('jane@example.com');
    });

    it('should get field values', () => {
      useFormsStore
        .getState()
        .setValue('test-form', { name: 'Jane', email: 'jane@example.com' });

      const values = useFormsStore.getState().getValues('test-form');

      expect(values).toEqual({ name: 'Jane', email: 'jane@example.com' });
    });
  });

  describe('Error Management', () => {
    beforeEach(() => {
      useFormsStore.getState().createForm('test-form');
      useFormsStore.getState().registerField('test-form', 'name');
      useFormsStore.getState().registerField('test-form', 'email');
    });

    it('should set field error', () => {
      useFormsStore
        .getState()
        .setFieldError('test-form', 'name', 'Name is required');

      const field = useFormsStore.getState().forms['test-form'].fields.name;

      expect(field.error).toBe('Name is required');
      expect(field.isValid).toBe(false);
    });

    it('should clear field error', () => {
      useFormsStore.getState().setFieldError('test-form', 'name', 'Error');
      expect(
        useFormsStore.getState().forms['test-form'].fields.name.error
      ).toBe('Error');

      useFormsStore.getState().setFieldError('test-form', 'name', undefined);

      const field = useFormsStore.getState().forms['test-form'].fields.name;

      expect(field.error).toBeUndefined();
      expect(field.isValid).toBe(true);
    });

    it('should update form validity based on field errors', () => {
      expect(useFormsStore.getState().forms['test-form'].isValid).toBe(true);

      useFormsStore.getState().setFieldError('test-form', 'name', 'Error');
      expect(useFormsStore.getState().forms['test-form'].isValid).toBe(false);

      useFormsStore.getState().setFieldError('test-form', 'name', undefined);
      expect(useFormsStore.getState().forms['test-form'].isValid).toBe(true);
    });

    it('should set multiple errors at once', () => {
      useFormsStore
        .getState()
        .setError('test-form', { name: 'Name error', email: 'Email error' });

      const form = useFormsStore.getState().forms['test-form'];

      expect(form.fields.name.error).toBe('Name error');
      expect(form.fields.email.error).toBe('Email error');
      expect(form.isValid).toBe(false);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      useFormsStore.getState().createForm('test-form');
    });

    it('should validate required fields', async () => {
      useFormsStore.getState().registerField('test-form', 'name', {
        rules: { required: true },
      });

      // Validate empty field
      await useFormsStore.getState().validateField('test-form', 'name');

      let field = useFormsStore.getState().forms['test-form'].fields.name;

      expect(field.error).toBeTruthy();
      expect(field.isValid).toBe(false);

      // Add value and validate
      useFormsStore.getState().setFieldValue('test-form', 'name', 'John');
      await useFormsStore.getState().validateField('test-form', 'name');

      field = useFormsStore.getState().forms['test-form'].fields.name;
      expect(field.error).toBeUndefined();
      expect(field.isValid).toBe(true);
    });

    it('should validate pattern rules', async () => {
      useFormsStore.getState().registerField('test-form', 'email', {
        rules: {
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email format',
          },
        },
      });

      // Invalid email
      useFormsStore
        .getState()
        .setFieldValue('test-form', 'email', 'invalid-email');
      await useFormsStore.getState().validateField('test-form', 'email');

      let field = useFormsStore.getState().forms['test-form'].fields.email;

      expect(field.error).toBe('Invalid email format');
      expect(field.isValid).toBe(false);

      // Valid email
      useFormsStore
        .getState()
        .setFieldValue('test-form', 'email', 'john@example.com');
      await useFormsStore.getState().validateField('test-form', 'email');

      field = useFormsStore.getState().forms['test-form'].fields.email;
      expect(field.error).toBeUndefined();
      expect(field.isValid).toBe(true);
    });
  });
});
