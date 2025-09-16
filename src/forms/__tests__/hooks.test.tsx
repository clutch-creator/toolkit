import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'bun:test';
import React from 'react';
import { useForm, useFormField } from '../hooks.js';
import { useFormsStore } from '../store.js';

describe('Forms Hooks', () => {
  beforeEach(() => {
    // Clear any existing forms
    useFormsStore.setState({ forms: {} });
  });

  describe('useForm', () => {
    it('should create form with new API structure', () => {
      const mockOnSubmit = () => {};
      const { result } = renderHook(() =>
        useForm({
          onSubmit: mockOnSubmit,
          defaultValues: { name: 'test' },
        })
      );

      expect(result.current.formState).toBeDefined();
      expect(result.current.formProps).toBeDefined();
      expect(result.current.formValues).toBeDefined();
      expect(result.current.onFormReset).toBeDefined();
      expect(result.current.onFormSubmit).toBeDefined();
      expect(result.current.FormProvider).toBeDefined();
    });

    it('should have correct initial form state', () => {
      const mockOnSubmit = () => {};
      const { result } = renderHook(() => useForm({ onSubmit: mockOnSubmit }));

      expect(result.current.formState.isValid).toBe(true);
      expect(result.current.formState.isDirty).toBe(false);
      expect(result.current.formState.isSubmitting).toBe(false);
      expect(result.current.formState.isSubmitted).toBe(false);
      expect(result.current.formState.errors).toEqual({});
    });
  });

  describe('useFormField', () => {
    it('should work with form context', () => {
      const mockOnSubmit = () => {};

      // First create a form to get the FormProvider
      const { result: formResult } = renderHook(() =>
        useForm({ onSubmit: mockOnSubmit })
      );

      // Then use the FormProvider to wrap useFormField
      const wrapper = ({ children }: { children: React.ReactNode }) => {
        const Provider = formResult.current.FormProvider;

        return <Provider>{children}</Provider>;
      };

      const { result: fieldResult } = renderHook(
        () =>
          useFormField({
            name: 'testField',
            defaultValue: 'initial',
            required: true,
            requiredMessage: 'Field is required',
          }),
        { wrapper }
      );

      expect(fieldResult.current.value).toBe('initial');
      expect(fieldResult.current.onChange).toBeDefined();
      expect(fieldResult.current.onBlur).toBeDefined();
      expect(fieldResult.current.isInvalid).toBe(false);
      expect(fieldResult.current.isDirty).toBe(false);
      expect(fieldResult.current.isTouched).toBe(false);
      expect(fieldResult.current.isValidating).toBe(false);
      expect(fieldResult.current.isValid).toBe(true);
    });

    it('should throw error when used outside FormProvider', () => {
      expect(() => {
        renderHook(() =>
          useFormField({
            name: 'testField',
            required: true,
          })
        );
      }).toThrow('useFormId must be used within a FormProvider');
    });
  });
});
