import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormField from './FormField';

describe('FormField', () => {
  it('labels its child and links the hint and error to it', () => {
    render(
      <FormField label="Name" required hint="Shown on the sheet" error="Too short">
        <input />
      </FormField>,
    );
    const input = screen.getByLabelText(/Name/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Too short Shown on the sheet');
  });

  it('prefers the validation error over the error prop', () => {
    render(
      <FormField label="Name" error="old" validation={{ isValid: false, error: 'new' }}>
        <input />
      </FormField>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('new');
  });
});
