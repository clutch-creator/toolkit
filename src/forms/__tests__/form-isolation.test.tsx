import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'bun:test';
import React from 'react';
import { FormProvider } from '../context.js';
import { useForm, useFormState, useFormValues } from '../hooks.js';
import { useFormsStore } from '../store.js';

interface SimpleFormProps {
  children: React.ReactNode;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  defaultValues?: Record<string, unknown>;
}

// Form component WITHOUT state hooks to isolate the issue
function SimpleForm({
  children,
  onSubmit: submitProp,
  defaultValues,
}: SimpleFormProps) {
  const { formId, onReset, onSubmit } = useForm({
    onSubmit: submitProp,
    defaultValues,
  });

  const formState = useFormState(formId);
  const values = useFormValues(formId);

  // Log to see what's happening - comment out for production
  // eslint-disable-next-line no-console
  console.log(
    'Form render - values:',
    values,
    'fieldErrors:',
    formState.fieldErrors
  );

  return (
    <FormProvider formId={formId}>
      <form
        aria-busy={formState.isSubmitting || false}
        aria-invalid={!formState.isValid}
      >
        {children}
      </form>
    </FormProvider>
  );
}

describe('Simple Form Without State Hooks', () => {
  beforeEach(() => {
    useFormsStore.setState({ forms: {} });
  });

  it('should render without infinite loops when no state hooks are used', async () => {
    let renderCount = 0;
    const mockOnSubmit = () => {};

    const TestForm = () => {
      renderCount++;
      // eslint-disable-next-line no-console
      console.log(`Render #${renderCount}`);

      return (
        <SimpleForm onSubmit={mockOnSubmit} defaultValues={{ test: 'value' }}>
          <input name='test' />
          <button type='submit'>Submit</button>
        </SimpleForm>
      );
    };

    render(<TestForm />);

    await new Promise(resolve => setTimeout(resolve, 200));

    // eslint-disable-next-line no-console
    console.log('Final render count:', renderCount);

    expect(renderCount).toBeLessThan(5); // Should stabilize quickly
  });
});
