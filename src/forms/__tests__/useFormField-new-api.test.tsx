import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'bun:test';
import React from 'react';
import { useForm, useFormField } from '../hooks.js';
import { useFormsStore } from '../store.js';

describe('useFormField New API', () => {
  beforeEach(() => {
    // Clear any existing forms
    useFormsStore.setState({ forms: {} });
  });

  it('should accept normalized props and return normalized output', () => {
    const mockOnSubmit = () => {};

    // Create a form to get the FormProvider
    const { result: formResult } = renderHook(() =>
      useForm({ onSubmit: mockOnSubmit })
    );

    // Create wrapper with FormProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      const Provider = formResult.current.FormProvider;

      return <Provider>{children}</Provider>;
    };

    // Use useFormField with all supported props
    const { result: fieldResult } = renderHook(
      () =>
        useFormField({
          name: 'username',
          defaultValue: 'john',
          required: true,
          requiredMessage: 'Username is required',
          minLength: 3,
          minLengthMessage: 'Username must be at least 3 characters',
          maxLength: 20,
          maxLengthMessage: 'Username cannot exceed 20 characters',
          pattern: /^[a-zA-Z0-9_]+$/,
          patternMessage:
            'Username can only contain letters, numbers, and underscores',
          validate: value => {
            if (value === 'admin') return 'Username cannot be admin';

            return true;
          },
        }),
      { wrapper }
    );

    const field = fieldResult.current;

    // Should have correct initial state
    expect(field.value).toBe('john');
    expect(field.onChange).toBeDefined();
    expect(field.onBlur).toBeDefined();
    expect(field.isInvalid).toBe(false);
    expect(field.isDirty).toBe(false);
    expect(field.isTouched).toBe(false);
    expect(field.isValidating).toBe(false);
    expect(field.isValid).toBe(true);

    // Test onChange functionality
    act(() => {
      field.onChange('newusername');
    });

    // Should have updated value and be dirty
    expect(fieldResult.current.value).toBe('newusername');
    expect(fieldResult.current.isDirty).toBe(true);

    // Test onBlur functionality
    act(() => {
      fieldResult.current.onBlur();
    });

    // Should be touched
    expect(fieldResult.current.isTouched).toBe(true);
  });

  it('should handle validation rules correctly', async () => {
    const mockOnSubmit = () => {};

    // Create a form to get the FormProvider
    const { result: formResult } = renderHook(() =>
      useForm({ onSubmit: mockOnSubmit })
    );

    // Create wrapper with FormProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      const Provider = formResult.current.FormProvider;

      return <Provider>{children}</Provider>;
    };

    // Use useFormField with validation rules
    const { result: fieldResult } = renderHook(
      () =>
        useFormField({
          name: 'email',
          required: true,
          requiredMessage: 'Email is required',
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          patternMessage: 'Please enter a valid email',
        }),
      { wrapper }
    );

    // Start with empty value (should be invalid due to required rule)
    act(() => {
      fieldResult.current.onChange('');
    });

    // Trigger validation
    const formId = Object.keys(useFormsStore.getState().forms)[0];

    await act(async () => {
      await useFormsStore.getState().validateField(formId, 'email');
    });

    expect(fieldResult.current.isInvalid).toBe(true);

    // Set invalid email format
    act(() => {
      fieldResult.current.onChange('invalid-email');
    });

    // Trigger validation
    await act(async () => {
      await useFormsStore.getState().validateField(formId, 'email');
    });

    expect(fieldResult.current.isInvalid).toBe(true);

    // Set valid email
    act(() => {
      fieldResult.current.onChange('test@example.com');
    });

    // Trigger validation
    await act(async () => {
      await useFormsStore.getState().validateField(formId, 'email');
    });

    expect(fieldResult.current.isInvalid).toBe(false);
  });

  it('should work with custom validate function', async () => {
    const mockOnSubmit = () => {};

    // Create a form to get the FormProvider
    const { result: formResult } = renderHook(() =>
      useForm({ onSubmit: mockOnSubmit })
    );

    // Create wrapper with FormProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      const Provider = formResult.current.FormProvider;

      return <Provider>{children}</Provider>;
    };

    // Use useFormField with custom validation
    const { result: fieldResult } = renderHook(
      () =>
        useFormField({
          name: 'password',
          validate: value => {
            if (typeof value === 'string' && value.length < 8) {
              return 'Password must be at least 8 characters';
            }
            if (typeof value === 'string' && !/\d/.test(value)) {
              return 'Password must contain at least one number';
            }

            return true;
          },
        }),
      { wrapper }
    );

    // Set short password
    act(() => {
      fieldResult.current.onChange('123');
    });

    // Trigger validation
    const formId = Object.keys(useFormsStore.getState().forms)[0];

    await act(async () => {
      await useFormsStore.getState().validateField(formId, 'password');
    });

    expect(fieldResult.current.isInvalid).toBe(true);

    // Set password without number
    act(() => {
      fieldResult.current.onChange('longpassword');
    });

    // Trigger validation
    await act(async () => {
      await useFormsStore.getState().validateField(formId, 'password');
    });

    expect(fieldResult.current.isInvalid).toBe(true);

    // Set valid password
    act(() => {
      fieldResult.current.onChange('validpass123');
    });

    // Trigger validation
    await act(async () => {
      await useFormsStore.getState().validateField(formId, 'password');
    });

    expect(fieldResult.current.isInvalid).toBe(false);
  });

  it('should handle event-like objects in onChange', () => {
    const mockOnSubmit = () => {};

    // Create a form to get the FormProvider
    const { result: formResult } = renderHook(() =>
      useForm({ onSubmit: mockOnSubmit })
    );

    // Create wrapper with FormProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      const Provider = formResult.current.FormProvider;

      return <Provider>{children}</Provider>;
    };

    const { result: fieldResult } = renderHook(
      () => useFormField({ name: 'test' }),
      { wrapper }
    );

    // Test with event-like object
    act(() => {
      fieldResult.current.onChange({ target: { value: 'event-value' } });
    });

    expect(fieldResult.current.value).toBe('event-value');

    // Test with direct value
    act(() => {
      fieldResult.current.onChange('direct-value');
    });

    expect(fieldResult.current.value).toBe('direct-value');
  });
});
