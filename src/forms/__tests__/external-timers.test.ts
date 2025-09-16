import { beforeEach, describe, expect, it, jest } from 'bun:test';
import { useFormsStore } from '../store.js';

describe('External Debounce Timers', () => {
  beforeEach(() => {
    // Clear store state
    useFormsStore.setState({ forms: {} });
  });

  it('should handle submit on change with external timer management', async () => {
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
    store.registerField('test-form', 'name');

    // Set field value multiple times rapidly
    store.setFieldValue('test-form', 'name', 'A');
    store.setFieldValue('test-form', 'name', 'AB');
    store.setFieldValue('test-form', 'name', 'ABC');

    // Should not have been called yet (debounced)
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have been called once with final value
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'ABC' });
  });

  it('should clean up timers when form is destroyed', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const store = useFormsStore.getState();

    // Create form with submit on change
    store.createForm('test-form', {
      submitOnChange: true,
      debounceTime: 500, // Long delay
      onSubmit: mockOnSubmit,
      defaultValues: { name: '' },
    });

    // Register field
    store.registerField('test-form', 'name');

    // Set field value - this should start a timer
    store.setFieldValue('test-form', 'name', 'Test');

    // Destroy form immediately (should clean up timer)
    store.destroyForm('test-form');

    // Wait longer than the debounce time
    await new Promise(resolve => setTimeout(resolve, 600));

    // Should not have been called since form was destroyed
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
