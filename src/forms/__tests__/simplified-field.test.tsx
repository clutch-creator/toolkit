import { beforeEach, describe, expect, it } from 'bun:test';
import { useFormsStore } from '../store.js';

describe('Simplified Field Logic', () => {
  beforeEach(() => {
    // Clear store state
    useFormsStore.setState({ forms: {} });
  });

  it('should handle setFieldValue with automatic validation for onChange mode', async () => {
    const store = useFormsStore.getState();

    // Create form with onChange validation mode
    store.createForm('test-form', {
      mode: 'onChange',
      defaultValues: { email: '' },
    });

    // Register field with validation
    store.registerField('test-form', 'email', {
      rules: {
        required: true,
        requiredMessage: 'Email is required',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Please enter a valid email',
      },
    });

    // Set valid value - should not trigger validation error
    store.setFieldValue('test-form', 'email', 'test@example.com');

    // Wait for validation to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    const currentState = useFormsStore.getState();
    const form = currentState.forms['test-form'];
    const field = form.fields['email'];

    expect(field.value).toBe('test@example.com');
    expect(field.error).toBeUndefined();
    expect(field.dirty).toBe(true);

    // Set invalid value - should trigger validation
    store.setFieldValue('test-form', 'email', 'invalid-email');

    await new Promise(resolve => setTimeout(resolve, 10));

    const updatedState = useFormsStore.getState();
    const updatedForm = updatedState.forms['test-form'];
    const updatedField = updatedForm.fields['email'];

    expect(updatedField.value).toBe('invalid-email');
    expect(updatedField.error).toBe('Please enter a valid email');
  });

  it('should handle setFieldTouched with automatic validation for onBlur mode', async () => {
    const store = useFormsStore.getState();

    // Create form with onBlur validation mode
    store.createForm('test-form', {
      mode: 'onBlur',
      defaultValues: { name: '' },
    });

    // Register field with validation
    store.registerField('test-form', 'name', {
      rules: {
        required: true,
        requiredMessage: 'Name is required',
      },
    });

    // Set field value (no validation yet for onBlur mode)
    store.setFieldValue('test-form', 'name', '');

    let currentState = useFormsStore.getState();
    let form = currentState.forms['test-form'];
    let field = form.fields['name'];

    expect(field.error).toBeUndefined(); // No validation yet
    expect(field.touched).toBe(false);

    // Touch field - should trigger validation for onBlur mode
    store.setFieldTouched('test-form', 'name', true);

    await new Promise(resolve => setTimeout(resolve, 10));

    currentState = useFormsStore.getState();
    form = currentState.forms['test-form'];
    field = form.fields['name'];

    expect(field.touched).toBe(true);
    expect(field.error).toBe('Name is required');
  });

  it('should not validate on touch for onChange mode', async () => {
    const store = useFormsStore.getState();

    // Create form with onChange validation mode
    store.createForm('test-form', {
      mode: 'onChange',
      defaultValues: { test: '' },
    });

    // Register field with validation
    store.registerField('test-form', 'test', {
      rules: {
        required: true,
        requiredMessage: 'Required',
      },
    });

    // Touch field - should NOT trigger validation for onChange mode
    store.setFieldTouched('test-form', 'test', true);

    await new Promise(resolve => setTimeout(resolve, 10));

    const currentState = useFormsStore.getState();
    const form = currentState.forms['test-form'];
    const field = form.fields['test'];

    expect(field.touched).toBe(true);
    expect(field.error).toBeUndefined(); // No validation on touch for onChange mode
  });

  it('should handle all validation mode correctly', async () => {
    const store = useFormsStore.getState();

    // Create form with 'all' validation mode
    store.createForm('test-form', {
      mode: 'all',
      defaultValues: { test: '' },
    });

    // Register field with validation
    store.registerField('test-form', 'test', {
      rules: {
        required: true,
        requiredMessage: 'Required',
      },
    });

    // Touch field - should trigger validation for 'all' mode
    store.setFieldTouched('test-form', 'test', true);

    await new Promise(resolve => setTimeout(resolve, 10));

    const currentState = useFormsStore.getState();
    const form = currentState.forms['test-form'];
    const field = form.fields['test'];

    expect(field.touched).toBe(true);
    expect(field.error).toBe('Required');
  });
});
