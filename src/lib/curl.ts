export interface CurlRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

function escapeShellArg(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** Generates a cURL command from the current request state. */
export function generateCurl({ method, url, headers = {}, body }: CurlRequest): string {
  const parts = [`curl -X ${method.toUpperCase()} ${escapeShellArg(url)}`];

  for (const [name, value] of Object.entries(headers)) {
    if (name.trim() !== '') {
      parts.push(`-H ${escapeShellArg(`${name}: ${value}`)}`);
    }
  }

  if (body !== undefined && body !== '') {
    parts.push(`-d ${escapeShellArg(body)}`);
  }

  return parts.join(' \\\n  ');
}
