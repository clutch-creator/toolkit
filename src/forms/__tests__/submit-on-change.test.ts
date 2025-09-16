import { beforeEach, describe, expect, it, jest } from 'bun:test';
import { useFormsStore } from '../store.js';

describe('Forms Store > Submit On Change', () => {
  beforeEach(() => {
    // Clear store state
    useFormsStore.setState({ forms: {} });
  });

  it('should handle submit on change when form is configured for it', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const store = useFormsStore.getState();

    // Create form with submit on change
    store.createForm('test-form', {
      submitOnChange: true,
      debounceTime: 100,
      onSubmit: mockOnSubmit,
      defaultValues: { name: '' },
    });

    // Register field
    store.registerField('test-form', 'name', {
      rules: { required: true, requiredMessage: 'Name is required' },
    });

    // Set field value - this should trigger submit on change
    store.setFieldValue('test-form', 'name', 'John Doe');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
  });

  it('should not submit on change when form is not configured for it', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const store = useFormsStore.getState();

    // Create form without submit on change
    store.createForm('test-form', {
      submitOnChange: false,
      onSubmit: mockOnSubmit,
      defaultValues: { name: '' },
    });

    // Register field
    store.registerField('test-form', 'name');

    // Set field value
    store.setFieldValue('test-form', 'name', 'John Doe');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should clean up debounce timers when form is destroyed', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const store = useFormsStore.getState();

    // Create form with submit on change
    store.createForm('test-form', {
      submitOnChange: true,
      debounceTime: 1000, // Long delay
      onSubmit: mockOnSubmit,
      defaultValues: { name: '' },
    });

    // Register field
    store.registerField('test-form', 'name');

    // Set field value - this should start a timer
    store.setFieldValue('test-form', 'name', 'John Doe');

    // Destroy form immediately (should clean up timer)
    store.destroyForm('test-form');

    // Wait for original timeout
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Should not have been called since form was destroyed
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should only submit when form is valid', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const store = useFormsStore.getState();

    // Create form with submit on change
    store.createForm('test-form', {
      submitOnChange: true,
      debounceTime: 100,
      onSubmit: mockOnSubmit,
      defaultValues: { name: '' },
    });

    // Register field with validation
    store.registerField('test-form', 'name', {
      rules: { required: true, requiredMessage: 'Name is required' },
    });

    // Set invalid value (empty)
    store.setFieldValue('test-form', 'name', '');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should not have been called because validation failed
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Set valid value
    store.setFieldValue('test-form', 'name', 'John Doe');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should now be called
    expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
  });

  it('should debounce multiple rapid changes', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const store = useFormsStore.getState();

    // Create form with submit on change
    store.createForm('test-form', {
      submitOnChange: true,
      debounceTime: 200,
      onSubmit: mockOnSubmit,
      defaultValues: { name: '' },
    });

    // Register field
    store.registerField('test-form', 'name');

    // Make rapid changes
    store.setFieldValue('test-form', 'name', 'J');
    store.setFieldValue('test-form', 'name', 'Jo');
    store.setFieldValue('test-form', 'name', 'Joh');
    store.setFieldValue('test-form', 'name', 'John');
    store.setFieldValue('test-form', 'name', 'John Doe');

    // Wait for less than debounce time
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not have been called yet
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Wait for full debounce time
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have been called only once with final value
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
  });
});
