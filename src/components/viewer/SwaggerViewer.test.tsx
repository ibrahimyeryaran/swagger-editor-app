import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { DEFAULT_SPEC } from '@/lib/openapi/default-spec';
import { validateSpec } from '@/lib/openapi/validate';
import type { ProxyResult } from '@/app/api/proxy/route';
import messages from '../../../messages/en.json';
import { SwaggerViewer } from './SwaggerViewer';

const doc = validateSpec(DEFAULT_SPEC).doc;

function renderViewer(docOverride = doc) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ToastProvider>
        <SwaggerViewer doc={docOverride} />
      </ToastProvider>
    </NextIntlClientProvider>
  );
}

function proxySuccess(overrides: Partial<ProxyResult> = {}): ProxyResult {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    body: '{"id":1}',
    durationMs: 123,
    requestSize: 0,
    responseSize: 8,
    ...overrides,
  };
}

describe('SwaggerViewer', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows a hint when no valid schema is loaded', () => {
    renderViewer(null);
    expect(screen.getByText(/Paste a valid OpenAPI/)).toBeInTheDocument();
  });

  it('lists endpoints organized by path and method', () => {
    renderViewer();
    expect(screen.getByText('Endpoints (3)')).toBeInTheDocument();
    expect(screen.getAllByText('GET')).toHaveLength(2);
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('/posts/{id}')).toBeInTheDocument();
  });

  it('shows parameters, request schema and responses for an endpoint', () => {
    renderViewer();
    fireEvent.click(screen.getByRole('button', { name: /GET \/posts\/\{id\}/ }));

    const table = screen.getByRole('table');
    expect(within(table).getByText('id')).toBeInTheDocument();
    expect(within(table).getByText('path')).toBeInTheDocument();
    expect(within(table).getByText('integer')).toBeInTheDocument();

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Post not found')).toBeInTheDocument();
    expect(screen.getAllByText('Schema').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Example').length).toBeGreaterThan(0);
  });

  it('prefills the request body with an example payload', () => {
    renderViewer();
    fireEvent.click(screen.getByRole('button', { name: /POST \/posts/ }));

    const body = screen.getByLabelText('Body') as HTMLTextAreaElement;
    expect(JSON.parse(body.value)).toMatchObject({ title: 'My new post' });
  });

  it('executes a request through the proxy and shows the response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(proxySuccess()), { status: 200 })
    );
    renderViewer();
    fireEvent.click(screen.getByRole('button', { name: /GET \/posts\/\{id\}/ }));

    fireEvent.change(screen.getByPlaceholderText('The post id'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Execute' }));

    await waitFor(() => expect(screen.getByTestId('response-panel')).toBeInTheDocument());
    expect(screen.getByText(/Status: 200 OK/)).toBeInTheDocument();
    expect(screen.getByText(/123 ms/)).toBeInTheDocument();

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(options?.body));
    expect(payload.url).toBe('https://jsonplaceholder.typicode.com/posts/5');
    expect(payload.method).toBe('GET');
  });

  it('shows 4xx responses in the response section, not as errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify(proxySuccess({ status: 404, statusText: 'Not Found', body: '{}' })),
        { status: 200 }
      )
    );
    renderViewer();
    fireEvent.click(screen.getByRole('button', { name: /GET \/posts\/\{id\}/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Execute' }));

    await waitFor(() => expect(screen.getByText(/Status: 404 Not Found/)).toBeInTheDocument());
  });

  it('shows network failures inside the response panel', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          error: 'getaddrinfo ENOTFOUND',
          durationMs: 10,
          requestSize: 0,
          responseSize: 0,
        }),
        { status: 200 }
      )
    );
    renderViewer();
    fireEvent.click(screen.getByRole('button', { name: /GET \/posts\/\{id\}/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Execute' }));

    await waitFor(() => expect(screen.getByText(/getaddrinfo ENOTFOUND/)).toBeInTheDocument());
  });

  it('shows a toast when the proxy itself cannot be reached', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    renderViewer();
    fireEvent.click(screen.getByRole('button', { name: /GET \/posts\/\{id\}/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Execute' }));

    await waitFor(() => expect(screen.getByText('Request failed')).toBeInTheDocument());
  });

  it('generates a curl command and copies it to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderViewer();
    fireEvent.click(screen.getByRole('button', { name: /POST \/posts/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate cURL' }));

    const curlBlock = screen.getByText(/curl -X POST/);
    expect(curlBlock.textContent).toContain('https://jsonplaceholder.typicode.com/posts');
    expect(curlBlock.textContent).toContain("-H 'Content-Type: application/json'");

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() =>
      expect(screen.getByText('cURL command copied to clipboard')).toBeInTheDocument()
    );
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('curl -X POST'));
  });
});
