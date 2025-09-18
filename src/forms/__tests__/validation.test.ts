import { beforeEach, describe, expect, it } from 'bun:test';
import { useFormsStore } from '../store.js';
import type { ValidationRule } from '../types.js';

describe('Forms Validation', () => {
  beforeEach(() => {
    useFormsStore.setState({ forms: {} });
  });

  describe('Field Validation', () => {
    it('should validate required fields', async () => {
      const store = useFormsStore.getState();
      const rules: ValidationRule = { required: true };

      store.createForm('test-form');
      store.registerField('test-form', 'name', { rules });

      // Empty value should fail
      store.setFieldValue('test-form', 'name', '');
      let isValid = await store.validateField('test-form', 'name');

      expect(isValid).toBe(false);

      let state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.name?.error).toBe(
        'This field is required'
      );

      // Non-empty value should pass
      store.setFieldValue('test-form', 'name', 'John');
      isValid = await store.validateField('test-form', 'name');

      expect(isValid).toBe(true);

      state = useFormsStore.getState();
      expect(state.forms['test-form']?.fields.name?.error).toBeUndefined();
    });

    it('should validate required fields with custom message', async () => {
      const store = useFormsStore.getState();
      const rules: ValidationRule = {
        required: true,
        requiredMessage: 'Name is required',
      };

      store.createForm('test-form');
      store.registerField('test-form', 'name', { rules });

      store.setFieldValue('test-form', 'name', '');
      const isValid = await store.validateField('test-form', 'name');

      expect(isValid).toBe(false);

      const state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.name?.error).toBe(
        'Name is required'
      );
    });

    it('should validate pattern rules', async () => {
      const store = useFormsStore.getState();
      const rules: ValidationRule = {
        pattern: /^[a-zA-Z]+$/,
      };

      store.createForm('test-form');
      store.registerField('test-form', 'name', { rules });

      // Invalid pattern should fail
      store.setFieldValue('test-form', 'name', 'John123');
      let isValid = await store.validateField('test-form', 'name');

      expect(isValid).toBe(false);
      let state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.name?.error).toBe(
        'Invalid format'
      );

      // Valid pattern should pass
      store.setFieldValue('test-form', 'name', 'John');
      isValid = await store.validateField('test-form', 'name');

      expect(isValid).toBe(true);
      state = useFormsStore.getState();
      expect(state.forms['test-form']?.fields.name?.error).toBeUndefined();
    });

    it('should validate pattern rules with custom message', async () => {
      const store = useFormsStore.getState();
      const rules: ValidationRule = {
        pattern: /^[a-zA-Z]+$/,
        patternMessage: 'Only letters are allowed',
      };

      store.createForm('test-form');
      store.registerField('test-form', 'name', { rules });

      store.setFieldValue('test-form', 'name', 'John123');
      const isValid = await store.validateField('test-form', 'name');

      expect(isValid).toBe(false);
      const state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.name?.error).toBe(
        'Only letters are allowed'
      );
    });

    it('should validate min/max number values', async () => {
      const store = useFormsStore.getState();
      const rules: ValidationRule = {
        min: 10,
        max: 100,
      };

      store.createForm('test-form');
      store.registerField('test-form', 'age', { rules });

      // Too low should fail
      store.setFieldValue('test-form', 'age', 5);
      let isValid = await store.validateField('test-form', 'age');

      expect(isValid).toBe(false);
      let state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.age?.error).toBe(
        'Value must be at least 10'
      );

      // Too high should fail
      store.setFieldValue('test-form', 'age', 150);
      isValid = await store.validateField('test-form', 'age');

      expect(isValid).toBe(false);
      state = useFormsStore.getState();
      expect(state.forms['test-form']?.fields.age?.error).toBe(
        'Value must be at most 100'
      );

      // Valid value should pass
      store.setFieldValue('test-form', 'age', 25);
      isValid = await store.validateField('test-form', 'age');

      expect(isValid).toBe(true);
      state = useFormsStore.getState();
      expect(state.forms['test-form']?.fields.age?.error).toBeUndefined();
    });

    it('should validate min/max with custom messages', async () => {
      const store = useFormsStore.getState();
      const rules: ValidationRule = {
        min: 18,
        minMessage: 'Must be at least 18 years old',
        max: 65,
        maxMessage: 'Must be at most 65 years old',
      };

      store.createForm('test-form');
      store.registerField('test-form', 'age', { rules });

      store.setFieldValue('test-form', 'age', 5);
      let isValid = await store.validateField('test-form', 'age');

      expect(isValid).toBe(false);
      let state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.age?.error).toBe(
        'Must be at least 18 years old'
      );

      store.setFieldValue('test-form', 'age', 70);
      isValid = await store.validateField('test-form', 'age');

      expect(isValid).toBe(false);
      state = useFormsStore.getState();
      expect(state.forms['test-form']?.fields.age?.error).toBe(
        'Must be at most 65 years old'
      );
    });

    it('should validate string length', async () => {
      const store = useFormsStore.getState();
      const rules: ValidationRule = {
        minLength: 3,
        maxLength: 10,
      };

      store.createForm('test-form');
      store.registerField('test-form', 'username', { rules });

      // Too short should fail
      store.setFieldValue('test-form', 'username', 'ab');
      let isValid = await store.validateField('test-form', 'username');

      expect(isValid).toBe(false);
      let state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.username?.error).toBe(
        'Must be at least 3 characters long'
      );

      // Too long should fail
      store.setFieldValue('test-form', 'username', 'verylongusername');
      isValid = await store.validateField('test-form', 'username');

      expect(isValid).toBe(false);
      state = useFormsStore.getState();
      expect(state.forms['test-form']?.fields.username?.error).toBe(
        'Must be at most 10 characters long'
      );

      // Valid length should pass
      store.setFieldValue('test-form', 'username', 'john123');
      isValid = await store.validateField('test-form', 'username');

      expect(isValid).toBe(true);
      state = useFormsStore.getState();
      expect(state.forms['test-form']?.fields.username?.error).toBeUndefined();
    });

    it('should validate string length with custom messages', async () => {
      const store = useFormsStore.getState();
      const rules: ValidationRule = {
        minLength: 5,
        minLengthMessage: 'Password must be at least 5 characters',
        maxLength: 20,
        maxLengthMessage: 'Password must be at most 20 characters',
      };

      store.createForm('test-form');
      store.registerField('test-form', 'password', { rules });

      // Too short
      store.setFieldValue('test-form', 'password', '123');
      let isValid = await store.validateField('test-form', 'password');

      expect(isValid).toBe(false);
      let state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.password?.error).toBe(
        'Password must be at least 5 characters'
      );

      // Too long
      store.setFieldValue(
        'test-form',
        'password',
        'verylongpasswordthatistoolong'
      );
      isValid = await store.validateField('test-form', 'password');

      expect(isValid).toBe(false);
      state = useFormsStore.getState();
      expect(state.forms['test-form']?.fields.password?.error).toBe(
        'Password must be at most 20 characters'
      );
    });
  });

  describe('Form Validation', () => {
    it('should validate entire form', async () => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
      store.registerField('test-form', 'name', { rules: { required: true } });
      store.registerField('test-form', 'email', { rules: { required: true } });

      // Set invalid values
      store.setFieldValue('test-form', 'name', '');
      store.setFieldValue('test-form', 'email', '');

      let isValid = await store.validateForm('test-form');

      expect(isValid).toBe(false);
      let state = useFormsStore.getState();

      expect(state.forms['test-form']?.isValid).toBe(false);

      // Set valid values
      store.setFieldValue('test-form', 'name', 'John');
      store.setFieldValue('test-form', 'email', 'john@example.com');

      isValid = await store.validateForm('test-form');

      expect(isValid).toBe(true);
      state = useFormsStore.getState();
      expect(state.forms['test-form']?.isValid).toBe(true);
    });
  });

  describe('Trigger Validation', () => {
    it('should trigger single field validation', async () => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
      store.registerField('test-form', 'name', { rules: { required: true } });

      store.setFieldValue('test-form', 'name', '');

      const isValid = await store.trigger('test-form', 'name');

      expect(isValid).toBe(false);
      const state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.name?.error).toBeDefined();
    });

    it('should trigger multiple field validation', async () => {
      const store = useFormsStore.getState();

      store.createForm('test-form');
      store.registerField('test-form', 'name', { rules: { required: true } });
      store.registerField('test-form', 'email', { rules: { required: true } });

      store.setFieldValue('test-form', 'name', '');
      store.setFieldValue('test-form', 'email', '');

      const isValid = await store.trigger('test-form', ['name', 'email']);

      expect(isValid).toBe(false);
      const state = useFormsStore.getState();

      expect(state.forms['test-form']?.fields.name?.error).toBeDefined();
      expect(state.forms['test-form']?.fields.email?.error).toBeDefined();
    });
  });
});
