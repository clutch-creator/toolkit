import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'bun:test';
import { useForm, useFormField } from '../hooks.js';
import { useFormsStore } from '../store.js';

describe('Forms Hooks', () => {
  beforeEach(() => {
    // Clear any existing forms
    useFormsStore.setState({ forms: {} });
  });

  describe('useForm', () => {
    it('should create and manage a form', () => {
      const { result } = renderHook(() => useForm('test-form'));

      expect(result.current.formState.isValid).toBe(true);
      expect(result.current.formState.isDirty).toBe(false);
      expect(result.current.formState.isSubmitting).toBe(false);
      expect(result.current.formState.mode).toBe('onSubmit');
    });

    it('should set field values using setValue', () => {
      const { result: formResult } = renderHook(() => useForm('test-form-3'));
      const { result: fieldResult } = renderHook(() =>
        useFormField('test-form-3', 'name')
      );

      // Wait for both hooks to initialize
      expect(formResult.current.fields).toBeDefined();
      expect(fieldResult.current.value).toBe('');

      act(() => {
        formResult.current.setValue('name', 'Jane');
      });

      expect(formResult.current.fields.name.value).toBe('Jane');
      expect(formResult.current.fields.name.dirty).toBe(true);
      expect(formResult.current.formState.isDirty).toBe(true);
    });

    it('should set field errors using setError', () => {
      const { result: formResult } = renderHook(() => useForm('test-form-4'));
      const { result: fieldResult } = renderHook(() =>
        useFormField('test-form-4', 'name')
      );

      // Wait for both hooks to initialize
      expect(formResult.current.fields).toBeDefined();
      expect(fieldResult.current.value).toBe('');

      act(() => {
        formResult.current.setError('name', 'Name is required');
      });

      expect(formResult.current.fields.name.error).toBe('Name is required');
      expect(formResult.current.fields.name.isValid).toBe(false);
      expect(formResult.current.formState.isValid).toBe(false);
    });

    it('should reset form using reset method', () => {
      const { result: formResult } = renderHook(() => useForm('test-form-5'));
      const { result: fieldResult } = renderHook(() =>
        useFormField('test-form-5', 'name')
      );

      // Wait for both hooks to initialize
      expect(formResult.current.fields).toBeDefined();
      expect(fieldResult.current.value).toBe('');

      act(() => {
        formResult.current.setValue('name', 'Jane');
        formResult.current.setError('name', 'Error');
      });

      expect(formResult.current.fields.name.value).toBe('Jane');
      expect(formResult.current.fields.name.error).toBe('Error');

      act(() => {
        formResult.current.reset();
      });

      expect(formResult.current.fields.name.value).toBe('');
      expect(formResult.current.fields.name.error).toBeUndefined();
      expect(formResult.current.formState.isDirty).toBe(false);
      expect(formResult.current.formState.isValid).toBe(true);
    });
  });

  describe('useFormField', () => {
    it('should manage individual field state', () => {
      renderHook(() => useForm('test-form-6')); // Create form first

      const { result } = renderHook(() => useFormField('test-form-6', 'name'));

      expect(result.current.value).toBe('');
      expect(result.current.error).toBeUndefined();
      expect(result.current.touched).toBe(false);
      expect(result.current.dirty).toBe(false);
      expect(result.current.isValid).toBe(true);
    });

    it('should update field value', () => {
      renderHook(() => useForm('test-form-7'));

      const { result } = renderHook(() => useFormField('test-form-7', 'name'));

      act(() => {
        result.current.setValue('Jane');
      });

      expect(result.current.value).toBe('Jane');
      expect(result.current.dirty).toBe(true);
    });

    it('should set field error', () => {
      renderHook(() => useForm('test-form-8'));

      const { result } = renderHook(() => useFormField('test-form-8', 'name'));

      act(() => {
        result.current.setError('Name is required');
      });

      expect(result.current.error).toBe('Name is required');
      expect(result.current.isValid).toBe(false);
    });

    it('should handle field touch state', () => {
      renderHook(() => useForm('test-form-9'));

      const { result } = renderHook(() => useFormField('test-form-9', 'name'));

      act(() => {
        result.current.setTouched(true);
      });

      expect(result.current.touched).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should sync form and field states', () => {
      const { result: formResult } = renderHook(() => useForm('test-form-11'));
      const { result: fieldResult } = renderHook(() =>
        useFormField('test-form-11', 'name')
      );

      // Change via form
      act(() => {
        formResult.current.setValue('name', 'Jane');
      });

      expect(fieldResult.current.value).toBe('Jane');
      expect(fieldResult.current.dirty).toBe(true);
      expect(formResult.current.formState.isDirty).toBe(true);

      // Change via field
      act(() => {
        fieldResult.current.setValue('Bob');
      });

      expect(formResult.current.fields.name.value).toBe('Bob');
    });
  });
});
