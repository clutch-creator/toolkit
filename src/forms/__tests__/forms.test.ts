import { describe, expect, it } from 'bun:test';
import { useFormsStore } from '../store.js';

describe('Forms System', () => {
  it('should work with basic form operations', () => {
    // Reset store
    useFormsStore.setState({ forms: {} });
    const store = useFormsStore.getState();

    // Create form
    store.createForm('test-form');
    const form = useFormsStore.getState().forms['test-form'];

    expect(form).toBeDefined();

    // Register field
    store.registerField('test-form', 'name', { defaultValue: 'John' });
    const field = useFormsStore.getState().forms['test-form'].fields.name;

    expect(field.value).toBe('John');

    // Update value
    store.setFieldValue('test-form', 'name', 'Jane');
    const updatedField =
      useFormsStore.getState().forms['test-form'].fields.name;

    expect(updatedField.value).toBe('Jane');
    expect(updatedField.dirty).toBe(true);

    // Set error
    store.setFieldError('test-form', 'name', 'Required');
    const errorField = useFormsStore.getState().forms['test-form'].fields.name;

    expect(errorField.error).toBe('Required');

    console.log('✅ All forms functionality working correctly!');
  });
});
