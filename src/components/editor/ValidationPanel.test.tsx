import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../../test/utils';
import { ValidationPanel } from './ValidationPanel';

describe('ValidationPanel', () => {
  it('shows a success badge for valid schemas', () => {
    renderWithIntl(
      <ValidationPanel validation={{ valid: true, errors: [], doc: {}, format: 'yaml' }} />
    );
    expect(screen.getByText('Valid OpenAPI schema')).toBeInTheDocument();
  });

  it('lists errors with line numbers for invalid schemas', () => {
    renderWithIntl(
      <ValidationPanel
        validation={{
          valid: false,
          errors: [{ message: 'bad indentation', line: 3 }, { message: 'missing info' }],
          doc: null,
          format: 'yaml',
        }}
      />
    );
    expect(screen.getByText('Schema has errors')).toBeInTheDocument();
    expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    expect(screen.getByText(/missing info/)).toBeInTheDocument();
  });
});
