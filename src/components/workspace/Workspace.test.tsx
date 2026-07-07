import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { DEFAULT_SPEC } from '@/lib/openapi/default-spec';
import messages from '../../../messages/en.json';
import { Workspace } from './Workspace';

vi.mock('@/components/editor/CodeEditor', () => ({
  CodeEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      data-testid="code-editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

function renderWorkspace(props?: Partial<Parameters<typeof Workspace>[0]>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ToastProvider>
        <Workspace
          initialContent={DEFAULT_SPEC}
          isAuthenticated={false}
          restored={false}
          {...props}
        />
      </ToastProvider>
    </NextIntlClientProvider>
  );
}

describe('Workspace', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the editor with a valid schema and populates the viewer', () => {
    renderWorkspace();
    expect(screen.getByTestId('code-editor')).toHaveValue(DEFAULT_SPEC);
    expect(screen.getByText('Valid OpenAPI schema')).toBeInTheDocument();
    expect(screen.getByText('JSONPlaceholder API')).toBeInTheDocument();
    expect(screen.getByText('/posts/{id}')).toBeInTheDocument();
  });

  it('converts the schema between YAML and JSON without data loss', () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole('button', { name: 'JSON' }));

    const editor = screen.getByTestId('code-editor');
    const converted = (editor as HTMLTextAreaElement).value;
    expect(converted.trimStart().startsWith('{')).toBe(true);
    expect(JSON.parse(converted).info.title).toBe('JSONPlaceholder API');

    fireEvent.click(screen.getByRole('button', { name: 'YAML' }));
    const backToYaml = (screen.getByTestId('code-editor') as HTMLTextAreaElement).value;
    expect(backToYaml.trimStart().startsWith('{')).toBe(false);
    expect(backToYaml).toContain('title: JSONPlaceholder API');
  });

  it('shows validation errors and hides endpoints for invalid schemas', () => {
    renderWorkspace();
    fireEvent.change(screen.getByTestId('code-editor'), { target: { value: 'foo: [broken' } });

    expect(screen.getByText('Schema has errors')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Paste a valid OpenAPI / Swagger schema in the editor to see its endpoints here.'
      )
    ).toBeInTheDocument();
  });

  it('hides the save button for guests and shows it for authenticated users', () => {
    const { unmount } = renderWorkspace();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    unmount();

    renderWorkspace({ isAuthenticated: true });
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('saves the schema through the api and shows a success toast', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    renderWorkspace({ isAuthenticated: true });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(screen.getByText('Schema saved to your account')).toBeInTheDocument()
    );
    expect(fetch).toHaveBeenCalledWith('/api/schema', expect.objectContaining({ method: 'PUT' }));
  });

  it('shows an error toast when saving fails', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 401 }));
    renderWorkspace({ isAuthenticated: true });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(screen.getByText('Could not save the schema')).toBeInTheDocument());
  });

  it('notifies the user when a saved schema was restored', () => {
    renderWorkspace({ isAuthenticated: true, restored: true });
    expect(screen.getByText('Your saved schema was restored')).toBeInTheDocument();
  });
});
