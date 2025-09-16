import { beforeEach, describe, expect, it } from 'bun:test';
import { useFormsStore } from '../store.js';

describe('Forms System Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    useFormsStore.setState({ forms: {} });
  });

  it('should create and manage forms', () => {
    const store = useFormsStore.getState();

    // Create form
    store.createForm('test-form');
    const form = useFormsStore.getState().forms['test-form'];

    expect(form).toBeDefined();
    expect(form.mode).toBe('onSubmit');
    expect(form.isValid).toBe(true);
    expect(form.isDirty).toBe(false);
  });

  it('should register and manage fields', () => {
    const store = useFormsStore.getState();

    store.createForm('test-form');
    store.registerField('test-form', 'name', { defaultValue: 'John' });

    const field = useFormsStore.getState().forms['test-form'].fields.name;

    expect(field.value).toBe('John');
    expect(field.dirty).toBe(false);
    expect(field.touched).toBe(false);
    expect(field.isValid).toBe(true);
  });

  it('should handle field values and dirty state', () => {
    const store = useFormsStore.getState();

    store.createForm('test-form');
    store.registerField('test-form', 'name', { defaultValue: 'John' });

    // Change value
    store.setFieldValue('test-form', 'name', 'Jane');

    let field = useFormsStore.getState().forms['test-form'].fields.name;

    expect(field.value).toBe('Jane');
    expect(field.dirty).toBe(true);

    // Form should be dirty too
    let form = useFormsStore.getState().forms['test-form'];

    expect(form.isDirty).toBe(true);

    // Reset to default value
    store.setFieldValue('test-form', 'name', 'John');

    field = useFormsStore.getState().forms['test-form'].fields.name;
    form = useFormsStore.getState().forms['test-form'];
    expect(field.dirty).toBe(false);
    expect(form.isDirty).toBe(false);
  });

  it('should handle errors and validation state', () => {
    const store = useFormsStore.getState();

    store.createForm('test-form');
    store.registerField('test-form', 'name');

    // Set error
    store.setFieldError('test-form', 'name', 'Name is required');

    let field = useFormsStore.getState().forms['test-form'].fields.name;
    let form = useFormsStore.getState().forms['test-form'];

    expect(field.error).toBe('Name is required');
    expect(field.isValid).toBe(false);
    expect(form.isValid).toBe(false);

    // Clear error
    store.setFieldError('test-form', 'name', undefined);

    field = useFormsStore.getState().forms['test-form'].fields.name;
    form = useFormsStore.getState().forms['test-form'];

    expect(field.error).toBeUndefined();
    expect(field.isValid).toBe(true);
    expect(form.isValid).toBe(true);
  });

  it('should validate required fields', async () => {
    const store = useFormsStore.getState();

    store.createForm('test-form');
    store.registerField('test-form', 'name', {
      rules: { required: true },
    });

    // Validate empty field
    await store.validateField('test-form', 'name');

    let field = useFormsStore.getState().forms['test-form'].fields.name;

    expect(field.error).toBeTruthy();
    expect(field.isValid).toBe(false);

    // Add value and validate
    store.setFieldValue('test-form', 'name', 'John');
    await store.validateField('test-form', 'name');

    field = useFormsStore.getState().forms['test-form'].fields.name;
    expect(field.error).toBeUndefined();
    expect(field.isValid).toBe(true);
  });

  it('should validate pattern rules', async () => {
    const store = useFormsStore.getState();

    store.createForm('test-form');
    store.registerField('test-form', 'email', {
      rules: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Invalid email format',
      },
    });

    // Invalid email
    store.setFieldValue('test-form', 'email', 'invalid-email');
    await store.validateField('test-form', 'email');

    let field = useFormsStore.getState().forms['test-form'].fields.email;

    expect(field.error).toBe('Invalid email format');
    expect(field.isValid).toBe(false);

    // Valid email
    store.setFieldValue('test-form', 'email', 'john@example.com');
    await store.validateField('test-form', 'email');

    field = useFormsStore.getState().forms['test-form'].fields.email;
    expect(field.error).toBeUndefined();
    expect(field.isValid).toBe(true);
  });

  it('should validate min/max length', async () => {
    const store = useFormsStore.getState();

    store.createForm('test-form');
    store.registerField('test-form', 'password', {
      rules: {
        minLength: 8,
        minLengthMessage: 'Too short',
        maxLength: 20,
        maxLengthMessage: 'Too long',
      },
    });

    // Too short
    store.setFieldValue('test-form', 'password', '123');
    await store.validateField('test-form', 'password');

    let field = useFormsStore.getState().forms['test-form'].fields.password;

    expect(field.error).toBe('Too short');

    // Too long
    store.setFieldValue('test-form', 'password', 'a'.repeat(25));
    await store.validateField('test-form', 'password');

    field = useFormsStore.getState().forms['test-form'].fields.password;
    expect(field.error).toBe('Too long');

    // Just right
    store.setFieldValue('test-form', 'password', 'password123');
    await store.validateField('test-form', 'password');

    field = useFormsStore.getState().forms['test-form'].fields.password;
    expect(field.error).toBeUndefined();
  });

  it('should handle multiple values at once', () => {
    const store = useFormsStore.getState();

    store.createForm('test-form');
    store.registerField('test-form', 'name', { defaultValue: 'John' });
    store.registerField('test-form', 'email', {
      defaultValue: 'john@example.com',
    });

    // Set multiple values
    store.setValue('test-form', {
      name: 'Jane',
      email: 'jane@example.com',
    });

    const form = useFormsStore.getState().forms['test-form'];

    expect(form.fields.name.value).toBe('Jane');
    expect(form.fields.email.value).toBe('jane@example.com');
    expect(form.isDirty).toBe(true);

    // Get all values
    const values = store.getValues('test-form');

    expect(values).toEqual({
      name: 'Jane',
      email: 'jane@example.com',
    });
  });

  it('should reset form properly', () => {
    const store = useFormsStore.getState();

    store.createForm('test-form');
    store.registerField('test-form', 'name', { defaultValue: 'John' });
    store.setFieldValue('test-form', 'name', 'Jane');
    store.setFieldError('test-form', 'name', 'Some error');

    // Verify changed state
    let field = useFormsStore.getState().forms['test-form'].fields.name;
    let form = useFormsStore.getState().forms['test-form'];

    expect(field.value).toBe('Jane');
    expect(field.error).toBe('Some error');
    expect(form.isDirty).toBe(true);

    // Reset
    store.resetForm('test-form');

    field = useFormsStore.getState().forms['test-form'].fields.name;
    form = useFormsStore.getState().forms['test-form'];

    expect(field.value).toBe('John'); // Back to default
    expect(field.error).toBeUndefined(); // Error cleared
    expect(field.dirty).toBe(false);
    expect(form.isDirty).toBe(false);
    expect(form.isValid).toBe(true);
  });
});
