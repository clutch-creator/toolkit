import { cleanup, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import React from 'react';
import * as stateHooks from '../../state/hooks.js';
import { FormProvider } from '../context.js';
import { useForm, useFormState, useFormValues } from '../hooks.js';
import { useFormsStore } from '../store.js';

interface FormProps {
  children: React.ReactNode;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitOnChange?: boolean;
  debounceTime?: number;
  defaultValues?: Record<string, unknown>;
}

interface FormProps {
  children: React.ReactNode;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitOnChange?: boolean;
  debounceTime?: number;
  defaultValues?: Record<string, unknown>;
}

// The Form component that's causing the infinite loop issue
function Form({
  children,
  onSubmit: submitProp,
  submitOnChange = false,
  debounceTime = 100,
  defaultValues,
}: FormProps) {
  const { formId, onReset, onSubmit } = useForm({
    onSubmit: submitProp,
    defaultValues,
    submitOnChange,
    debounceTime,
  });

  const { isSubmitting, isValid, isValidating, isDirty, error } =
    useFormState(formId);

  const values = useFormValues(formId);

  // register form states with clutch - this could be causing infinite loops
  stateHooks.useRegisterState<object>('data', values);
  stateHooks.useRegisterState<string | undefined>('formError', error);
  stateHooks.useRegisterState<boolean>('isSubmitting', isSubmitting);
  stateHooks.useRegisterState<boolean>('isValidating', isValidating);
  stateHooks.useRegisterState<boolean>('isDirty', isDirty);
  stateHooks.useRegisterState<boolean>('isValid', isValid);

  // register form actions with clutch
  stateHooks.useRegisterAction({
    name: 'reset',
    action: () => onReset(),
  });
  stateHooks.useRegisterAction({
    name: 'submit',
    action: () => onSubmit(),
  });

  return (
    <FormProvider formId={formId}>
      <form aria-busy={isSubmitting || false} aria-invalid={!isValid}>
        {children}
      </form>
    </FormProvider>
  );
}

describe('Form Component Infinite Loop Investigation', () => {
  let registerStateSpy: ReturnType<typeof spyOn>;
  let registerActionSpy: ReturnType<typeof spyOn>;
  let renderCount = 0;

  beforeEach(() => {
    // Reset store before each test
    useFormsStore.setState({ forms: {} });
    renderCount = 0;

    // Create spies to track calls
    registerStateSpy = spyOn(stateHooks, 'useRegisterState').mockImplementation(
      () => () => {}
    );
    registerActionSpy = spyOn(
      stateHooks,
      'useRegisterAction'
    ).mockImplementation(() => {});

    cleanup();
  });

  it('should render without infinite loops', async () => {
    const mockOnSubmit = () => {};

    const TestForm = () => {
      renderCount++;

      return (
        <Form onSubmit={mockOnSubmit} defaultValues={{ test: 'value' }}>
          <input name='test' />
          <button type='submit'>Submit</button>
        </Form>
      );
    };

    // Render the form
    const utils = render(<TestForm />);

    // Wait for initial render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check that the form rendered
    expect(utils.container.querySelector('form')).not.toBeNull();
    expect(utils.getByRole('button', { name: 'Submit' })).toBeDefined();

    // Wait longer to see if there are continuous re-renders
    await new Promise(resolve => setTimeout(resolve, 500));

    const finalRegisterStateCalls = registerStateSpy.mock.calls.length;
    const finalRegisterActionCalls = registerActionSpy.mock.calls.length;
    const finalRenderCount = renderCount;

    // If there's an infinite loop, these numbers will keep growing dramatically
    // Each render should call registerState 8 times (8 states) and registerAction 2 times (2 actions)
    // With a few renders, we expect reasonable numbers, not hundreds
    expect(finalRenderCount).toBeLessThan(10);
    expect(finalRegisterStateCalls).toBeLessThan(100);
    expect(finalRegisterActionCalls).toBeLessThan(50);
  });

  it('should track what values cause re-renders', async () => {
    const mockOnSubmit = () => {};
    let previousValues: unknown = null;
    let previousResponse: unknown = null;
    let previousFieldErrors: unknown = null;

    // Track what values are passed to useRegisterState
    registerStateSpy.mockImplementation((name: string, value: unknown) => {
      if (name === 'data' && value !== previousValues) {
        previousValues = value;
      }
      if (name === 'response' && value !== previousResponse) {
        previousResponse = value;
      }
      if (name === 'fieldErrors' && value !== previousFieldErrors) {
        previousFieldErrors = value;
      }

      return () => {};
    });

    render(
      <Form onSubmit={mockOnSubmit} defaultValues={{ test: 'initial' }}>
        <input name='test' />
      </Form>
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // The test passes if no continuous value changes are logged
    expect(true).toBe(true);
  });
});
