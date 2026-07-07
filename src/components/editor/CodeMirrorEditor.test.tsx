import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CodeMirrorEditor from './CodeMirrorEditor';

vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      data-testid="codemirror"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

describe('CodeMirrorEditor', () => {
  it('renders the value and propagates changes', () => {
    const onChange = vi.fn();
    render(<CodeMirrorEditor value="openapi: 3.0.0" format="yaml" onChange={onChange} />);

    const editor = screen.getByTestId('codemirror');
    expect(editor).toHaveValue('openapi: 3.0.0');

    fireEvent.change(editor, { target: { value: '{}' } });
    expect(onChange).toHaveBeenCalledWith('{}');
  });

  it('renders with the json language as well', () => {
    render(<CodeMirrorEditor value="{}" format="json" onChange={() => undefined} />);
    expect(screen.getByTestId('codemirror')).toHaveValue('{}');
  });
});
