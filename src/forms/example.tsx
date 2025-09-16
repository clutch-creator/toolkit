// Example usage of the new useForm API

import { useForm } from './hooks';

function MyForm() {
  const { formState, formProps, formValues, onFormReset, onFormSubmit } =
    useForm({
      onSubmit: async (values, event) => {
        console.log('Form submitted:', values);
        // Handle form submission here
      },
      defaultValues: {
        name: '',
        email: '',
      },
      submitOnChange: false,
      debounceTime: 300,
    });

  return (
    <form {...formProps}>
      <input
        name='name'
        value={formValues.name}
        onChange={e => {
          // You would need field-level management here
          // This is just showing the form structure
        }}
        aria-invalid={formState.errors.name ? 'true' : 'false'}
      />

      <input
        name='email'
        value={formValues.email}
        onChange={e => {
          // You would need field-level management here
        }}
        aria-invalid={formState.errors.email ? 'true' : 'false'}
      />

      <button type='submit' disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>

      <button type='button' onClick={onFormReset}>
        Reset
      </button>

      {formState.errors &&
        Object.keys(formState.errors).map(key => (
          <div key={key} role='alert'>
            {formState.errors[key]}
          </div>
        ))}
    </form>
  );
}
