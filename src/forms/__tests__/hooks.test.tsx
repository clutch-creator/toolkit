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
      const { result } = renderHook(() => useForm({ id: 'test-form' }));

      expect(result.current.formState.isValid).toBe(true);
      expect(result.current.formState.isDirty).toBe(false);
      expect(result.current.formState.isSubmitting).toBe(false);
      expect(result.current.formState.mode).toBe('onSubmit');
    });

    it('should set field values using setValue', () => {
      const { result: formResult } = renderHook(() => useForm({ id: 'test-form-3' }));
      
      // Register field directly through the store to ensure it exists
      act(() => {
        useFormsStore.getState().registerField('test-form-3', 'name', {});
      });

      act(() => {
        formResult.current.setValue('name', 'Jane');
      });

      // Get fresh form state
      const formState = useFormsStore.getState().forms['test-form-3'];

      expect(formState.fields.name.value).toBe('Jane');
      expect(formState.fields.name.dirty).toBe(true);
      expect(formState.isDirty).toBe(true);
    });

    it('should set field errors using setError', () => {
      const { result: formResult } = renderHook(() => useForm({ id: 'test-form-4' }));

      // Register field directly through the store to ensure it exists
      act(() => {
        useFormsStore.getState().registerField('test-form-4', 'name', {});
      });

      act(() => {
        formResult.current.setError('name', 'Name is required');
      });

      // Get fresh form state
      const formState = useFormsStore.getState().forms['test-form-4'];

      expect(formState.fields.name.error).toBe('Name is required');
      expect(formState.fields.name.isValid).toBe(false);
      expect(formState.isValid).toBe(false);
    });

    it('should reset form using reset method', () => {
      const { result: formResult } = renderHook(() => useForm({ id: 'test-form-5' }));

      // Register field directly through the store to ensure it exists
      act(() => {
        useFormsStore.getState().registerField('test-form-5', 'name', {});
      });

      act(() => {
        formResult.current.setValue('name', 'Jane');
        formResult.current.setError('name', 'Error');
      });

      // Check initial state
      let formState = useFormsStore.getState().forms['test-form-5'];

      expect(formState.fields.name.value).toBe('Jane');
      expect(formState.fields.name.error).toBe('Error');

      act(() => {
        formResult.current.reset();
      });

      // Check reset state
      formState = useFormsStore.getState().forms['test-form-5'];
      expect(formState.fields.name.value).toBe('');
      expect(formState.fields.name.error).toBeUndefined();
      expect(formState.isDirty).toBe(false);
      expect(formState.isValid).toBe(true);
    });
  });

  describe('useFormField', () => {
    it('should manage individual field state', () => {
      renderHook(() => useForm({ id: 'test-form-6' })); // Create form first

      const { result } = renderHook(() => useFormField('test-form-6', 'name'));

      expect(result.current.value).toBe('');
      expect(result.current.error).toBeUndefined();
      expect(result.current.touched).toBe(false);
      expect(result.current.dirty).toBe(false);
      expect(result.current.isValid).toBe(true);
    });

    it('should update field value', () => {
      renderHook(() => useForm({ id: 'test-form-7' }));

      const { result } = renderHook(() => useFormField('test-form-7', 'name'));

      act(() => {
        result.current.setValue('Jane');
      });

      expect(result.current.value).toBe('Jane');
      expect(result.current.dirty).toBe(true);
    });

    it('should set field error', () => {
      renderHook(() => useForm({ id: 'test-form-8' }));

      const { result } = renderHook(() => useFormField('test-form-8', 'name'));

      act(() => {
        result.current.setError('Name is required');
      });

      expect(result.current.error).toBe('Name is required');
      expect(result.current.isValid).toBe(false);
    });

    it('should handle field touch state', () => {
      renderHook(() => useForm({ id: 'test-form-9' }));

      const { result } = renderHook(() => useFormField('test-form-9', 'name'));

      act(() => {
        result.current.setTouched(true);
      });

      expect(result.current.touched).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should sync form and field states', () => {
      const { result: formResult } = renderHook(() => useForm({ id: 'test-form-11' }));
      const { result: fieldResult } = renderHook(() =>
        useFormField('test-form-11', 'name')
      );

      // Change via form
      act(() => {
        formResult.current.setValue('name', 'Jane');
      });

      expect(fieldResult.current.value).toBe('Jane');
      expect(fieldResult.current.dirty).toBe(true);
      
      const formState = useFormsStore.getState().forms['test-form-11'];
      expect(formState.isDirty).toBe(true);

      // Change via field
      act(() => {
        fieldResult.current.setValue('Bob');
      });

      const updatedFormState = useFormsStore.getState().forms['test-form-11'];
      expect(updatedFormState.fields.name.value).toBe('Bob');
    });
  });
});
