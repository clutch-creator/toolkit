import { render, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'bun:test';
import React from 'react';
import { FormProvider, useFormId } from '../context.js';

describe('Forms Context', () => {
  describe('useFormId', () => {
    it('should return global when used outside FormProvider', () => {
      const { result } = renderHook(() => useFormId());

      expect(result.current).toBe('global');
    });

    it('should return provided formId when used inside FormProvider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormProvider formId='test-form-id'>{children}</FormProvider>
      );

      const { result } = renderHook(() => useFormId(), { wrapper });

      expect(result.current).toBe('test-form-id');
    });
  });

  describe('FormProvider', () => {
    it('should provide formId to children', () => {
      const TestComponent = () => {
        const formId = useFormId();

        return <div data-testid='form-id'>{formId}</div>;
      };

      const { getByTestId } = render(
        <FormProvider formId='my-custom-form'>
          <TestComponent />
        </FormProvider>
      );

      expect(getByTestId('form-id').textContent).toBe('my-custom-form');
    });

    it('should handle nested FormProviders', () => {
      const TestComponent = () => {
        const formId = useFormId();

        return <div data-testid='nested-form-id'>{formId}</div>;
      };

      const { getByTestId } = render(
        <FormProvider formId='outer-form'>
          <FormProvider formId='inner-form'>
            <TestComponent />
          </FormProvider>
        </FormProvider>
      );

      // Inner provider should override outer provider
      expect(getByTestId('nested-form-id').textContent).toBe('inner-form');
    });
  });
});
