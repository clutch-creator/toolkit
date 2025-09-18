import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import React from 'react';
import { FormProvider } from '../context.js';
import { useForm, useFormField, useFormValues } from '../hooks.js';
import { useFormsStore } from '../store.js';

function FormShell({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { formId } = useForm({ id, onSubmit: () => {} });

  return <FormProvider formId={formId}>{children}</FormProvider>;
}

// Removed CheckedProbe component

describe('useFormField checkbox/radio support', () => {
  beforeEach(() => {
    useFormsStore.setState({ forms: {} });
  });

  afterEach(() => {
    cleanup();
  });

  it('radio-like: checked reflects equality when option value is provided', () => {
    function Comp() {
      const a = useFormField({ name: 'choice', value: 'a' });
      const b = useFormField({ name: 'choice', value: 'b' });
      const values = useFormValues('test-form');

      return (
        <form>
          <input
            data-testid='a'
            type='radio'
            name='choice'
            value='a'
            checked={a.checked}
            onChange={a.onChange}
          />
          <input
            data-testid='b'
            type='radio'
            name='choice'
            value='b'
            checked={b.checked}
            onChange={b.onChange}
          />
          <div data-testid='value-radio'>{String(values['choice'])}</div>
        </form>
      );
    }

    const { getByTestId } = render(
      <FormShell id='test-form'>
        <Comp />
      </FormShell>
    );

    // Initially unchecked
    expect((getByTestId('a') as HTMLInputElement).checked).toBe(false);
    expect((getByTestId('b') as HTMLInputElement).checked).toBe(false);

    // Select a
    fireEvent.click(getByTestId('a'));
    expect((getByTestId('a') as HTMLInputElement).checked).toBe(true);
    expect((getByTestId('b') as HTMLInputElement).checked).toBe(false);
    expect(getByTestId('value-radio').textContent).toBe('a');

    // Select b
    fireEvent.click(getByTestId('b'));
    expect((getByTestId('a') as HTMLInputElement).checked).toBe(false);
    expect((getByTestId('b') as HTMLInputElement).checked).toBe(true);
    expect(getByTestId('value-radio').textContent).toBe('b');
  });

  it('checkbox group (multiple): toggles array membership and checked state', () => {
    function Comp() {
      const a = useFormField({ name: 'tags', value: 'red', multiple: true });
      const b = useFormField({ name: 'tags', value: 'blue', multiple: true });
      const values = useFormValues('test-form');

      return (
        <form>
          <input
            data-testid='red'
            type='checkbox'
            name='tags'
            value='red'
            checked={a.checked}
            onChange={a.onChange}
          />
          <input
            data-testid='blue'
            type='checkbox'
            name='tags'
            value='blue'
            checked={b.checked}
            onChange={b.onChange}
          />
          <div data-testid='value-checkbox'>
            {JSON.stringify(values['tags'])}
          </div>
        </form>
      );
    }

    const { getByTestId } = render(
      <FormShell id='test-form'>
        <Comp />
      </FormShell>
    );

    // Initially unchecked
    expect((getByTestId('red') as HTMLInputElement).checked).toBe(false);
    expect((getByTestId('blue') as HTMLInputElement).checked).toBe(false);

    // Check red
    fireEvent.click(getByTestId('red'));
    expect((getByTestId('red') as HTMLInputElement).checked).toBe(true);
    expect(getByTestId('value-checkbox').textContent).toBe('["red"]');
    // Check blue
    fireEvent.click(getByTestId('blue'));
    expect((getByTestId('blue') as HTMLInputElement).checked).toBe(true);
    expect(getByTestId('value-checkbox').textContent).toBe('["red","blue"]');

    // Uncheck red
    fireEvent.click(getByTestId('red'));
    expect((getByTestId('red') as HTMLInputElement).checked).toBe(false);
    expect(getByTestId('value-checkbox').textContent).toBe('["blue"]');
  });

  it('checked reflects boolean value when no option value is provided', () => {
    function Comp() {
      const field = useFormField({ name: 'agree' });

      return (
        <form>
          <input
            data-testid='agree'
            type='checkbox'
            name='agree'
            checked={field.checked}
            onChange={field.onChange}
          />
        </form>
      );
    }

    const { getByTestId } = render(
      <FormShell id='test-form'>
        <Comp />
      </FormShell>
    );

    expect((getByTestId('agree') as HTMLInputElement).checked).toBe(false);
    fireEvent.click(getByTestId('agree'));
    expect((getByTestId('agree') as HTMLInputElement).checked).toBe(true);
  });
});
