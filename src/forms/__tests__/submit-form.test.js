import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useFormsStore } from '../store.js';

describe('Forms Store > Submit Form', () => {
  const formId = 'test-form';

  beforeEach(() => {
    useFormsStore.setState({ forms: {} });
  });

  it('should handle simple form submission', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

    const { createForm, registerField, setFieldValue, submitForm } =
      useFormsStore.getState();

    createForm(formId, { onSubmit: mockOnSubmit });
    registerField(formId, 'email', { value: '' });
    setFieldValue(formId, 'email', 'test@example.com');

    await submitForm(formId);

    const form = useFormsStore.getState().forms[formId];

    expect(form.isSubmitting).toBe(false);
    expect(form.isSubmitted).toBe(true);
    expect(form.isSubmitSuccessful).toBe(true);
    expect(form.submitCount).toBe(1);
    expect(mockOnSubmit).toHaveBeenCalledWith(
      { email: 'test@example.com' },
      undefined
    );
  });

  it('should handle structured response with success message', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      updateUser: {
        values: { email: 'test@example.com' },
        successMessage: 'User updated successfully!',
      },
    });

    const { createForm, registerField, setFieldValue, submitForm } =
      useFormsStore.getState();

    createForm(formId, { onSubmit: mockOnSubmit });
    registerField(formId, 'email', { value: '' });
    setFieldValue(formId, 'email', 'test@example.com');

    await submitForm(formId);

    const form = useFormsStore.getState().forms[formId];

    expect(form.isSubmitting).toBe(false);
    expect(form.isSubmitted).toBe(true);
    expect(form.isSubmitSuccessful).toBe(true);
    expect(form.successMessage).toBe('User updated successfully!');
    expect(form.submitCount).toBe(1);
  });

  it('should handle structured response with field errors', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      updateUser: {
        fieldErrors: {
          email: 'Email is already taken',
          username: 'Username is required',
        },
      },
    });

    const { createForm, registerField, setFieldValue, submitForm } =
      useFormsStore.getState();

    createForm(formId, { onSubmit: mockOnSubmit });
    registerField(formId, 'email', { value: '' });
    registerField(formId, 'username', { value: '' });
    setFieldValue(formId, 'email', 'test@example.com');

    await submitForm(formId);

    const form = useFormsStore.getState().forms[formId];

    expect(form.isSubmitting).toBe(false);
    expect(form.isSubmitted).toBe(true);
    expect(form.isSubmitSuccessful).toBe(false);
    expect(form.fields.email.error).toBe('Email is already taken');
    expect(form.fields.username.error).toBe('Username is required');
    expect(form.submitCount).toBe(1);
  });

  it('should handle structured response with general error', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      updateUser: {
        error: 'Server error occurred',
      },
    });

    const { createForm, registerField, setFieldValue, submitForm } =
      useFormsStore.getState();

    createForm(formId, { onSubmit: mockOnSubmit });
    registerField(formId, 'email', { value: '' });
    setFieldValue(formId, 'email', 'test@example.com');

    await submitForm(formId);

    const form = useFormsStore.getState().forms[formId];

    expect(form.isSubmitting).toBe(false);
    expect(form.isSubmitted).toBe(true);
    expect(form.isSubmitSuccessful).toBe(false);
    expect(form.submitError).toBe('Server error occurred');
    expect(form.submitCount).toBe(1);
  });

  it('should handle thrown errors during submission', async () => {
    const mockOnSubmit = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));

    const { createForm, registerField, setFieldValue, submitForm } =
      useFormsStore.getState();

    createForm(formId, { onSubmit: mockOnSubmit });
    registerField(formId, 'email', { value: '' });
    setFieldValue(formId, 'email', 'test@example.com');

    await submitForm(formId);

    const form = useFormsStore.getState().forms[formId];

    expect(form.isSubmitting).toBe(false);
    expect(form.isSubmitted).toBe(true);
    expect(form.isSubmitSuccessful).toBe(false);
    expect(form.submitError).toBe('Network error');
    expect(form.submitCount).toBe(1);
  });

  it('should not submit if validation fails', async () => {
    const mockOnSubmit = jest.fn();

    const { createForm, registerField, submitForm } = useFormsStore.getState();

    createForm(formId, { onSubmit: mockOnSubmit });
    registerField(formId, 'email', {
      value: '',
      rules: {
        required: true,
        requiredMessage: 'Email is required',
      },
    });

    await submitForm(formId);

    const form = useFormsStore.getState().forms[formId];

    expect(form.isSubmitting).toBe(false);
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(form.fields.email.error).toBe('Email is required');
  });

  it('should prevent default and stop propagation when event is provided', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };

    const { createForm, registerField, setFieldValue, submitForm } =
      useFormsStore.getState();

    createForm(formId, { onSubmit: mockOnSubmit });
    registerField(formId, 'email', { value: '' });
    setFieldValue(formId, 'email', 'test@example.com');

    await submitForm(formId, mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockOnSubmit).toHaveBeenCalledWith(
      { email: 'test@example.com' },
      mockEvent
    );
  });

  it('should handle multiple action responses correctly', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      updateUser: {
        successMessage: 'User updated!',
      },
      updatePreferences: {
        error: 'Preferences update failed',
      },
    });

    const { createForm, registerField, setFieldValue, submitForm } =
      useFormsStore.getState();

    createForm(formId, { onSubmit: mockOnSubmit });
    registerField(formId, 'email', { value: '' });
    setFieldValue(formId, 'email', 'test@example.com');

    await submitForm(formId);

    const form = useFormsStore.getState().forms[formId];

    expect(form.isSubmitting).toBe(false);
    expect(form.isSubmitted).toBe(true);
    expect(form.isSubmitSuccessful).toBe(false); // Should be false because of the error
    expect(form.submitError).toBe('Preferences update failed');
    expect(form.successMessage).toBeUndefined(); // Should not set success message when there's an error
    expect(form.submitCount).toBe(1);
  });
});
