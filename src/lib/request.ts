import type { ParameterObject } from './openapi/types';

export interface PreparedRequest {
  url: string;
  headers: Record<string, string>;
}

/**
 * Builds the target URL and headers from parameter values entered by the
 * user: path params are substituted, query params appended, header and
 * cookie params turned into headers.
 */
export function prepareRequest(
  baseUrl: string,
  path: string,
  parameters: ParameterObject[],
  values: Record<string, string>
): PreparedRequest {
  let resolvedPath = path;
  const query = new URLSearchParams();
  const headers: Record<string, string> = {};
  const cookies: string[] = [];

  for (const param of parameters) {
    if (!param.name) {
      continue;
    }
    const value = values[`${param.in}:${param.name}`] ?? '';
    if (value === '') {
      continue;
    }
    switch (param.in) {
      case 'path':
        resolvedPath = resolvedPath.replaceAll(`{${param.name}}`, encodeURIComponent(value));
        break;
      case 'query':
        query.append(param.name, value);
        break;
      case 'header':
        headers[param.name] = value;
        break;
      case 'cookie':
        cookies.push(`${param.name}=${value}`);
        break;
    }
  }

  if (cookies.length > 0) {
    headers['Cookie'] = cookies.join('; ');
  }

  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const queryString = query.toString();
  const url = `${base}${resolvedPath}${queryString ? `?${queryString}` : ''}`;

  return { url, headers };
}

/** Formats a byte count for display. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Formats milliseconds for display. */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Pretty-prints a body when it is JSON; returns it unchanged otherwise. */
export function prettifyBody(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}
