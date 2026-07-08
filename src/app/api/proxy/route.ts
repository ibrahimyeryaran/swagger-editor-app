import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface ProxyPayload {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface ProxyResult {
  ok: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
  durationMs: number;
  requestSize: number;
  responseSize: number;
}

const BODYLESS_METHODS = new Set(['GET', 'HEAD']);
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const BLOCKED_HEADERS = new Set(['host', 'connection', 'content-length', 'accept-encoding']);
const REQUEST_TIMEOUT_MS = 30_000;

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === 'string')
  );
}

function parsePayload(data: unknown): ProxyPayload | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const { url, method, headers, body } = data as Record<string, unknown>;
  if (typeof url !== 'string' || typeof method !== 'string') {
    return null;
  }
  if (!ALLOWED_METHODS.has(method.toUpperCase())) {
    return null;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
  } catch {
    return null;
  }
  if (headers !== undefined && !isRecordOfStrings(headers)) {
    return null;
  }
  if (body !== undefined && typeof body !== 'string') {
    return null;
  }
  return { url, method: method.toUpperCase(), headers, body };
}

function filterHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (name.trim() !== '' && !BLOCKED_HEADERS.has(name.toLowerCase())) {
      result[name] = value;
    }
  }
  return result;
}

async function recordAnalytics(result: ProxyResult, payload: ProxyPayload): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return;
    }
    await supabase.from('request_history').insert({
      user_id: user.id,
      method: payload.method,
      url: payload.url,
      status_code: result.status ?? null,
      duration_ms: Math.round(result.durationMs),
      request_size: result.requestSize,
      response_size: result.responseSize,
      error: result.error ?? null,
    });
  } catch {
    // Analytics must never break the proxied response.
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const payload = parsePayload(data);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid proxy request payload' }, { status: 400 });
  }

  const includeBody = payload.body !== undefined && !BODYLESS_METHODS.has(payload.method);
  const requestSize = includeBody ? new TextEncoder().encode(payload.body).byteLength : 0;

  const start = performance.now();
  let result: ProxyResult;

  try {
    const response = await fetch(payload.url, {
      method: payload.method,
      headers: filterHeaders(payload.headers ?? {}),
      body: includeBody ? payload.body : undefined,
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const bodyText = await response.text();
    result = {
      ok: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: bodyText,
      durationMs: performance.now() - start,
      requestSize,
      responseSize: new TextEncoder().encode(bodyText).byteLength,
    };
  } catch (error) {
    result = {
      ok: false,
      error: error instanceof Error ? error.message : 'Request failed',
      durationMs: performance.now() - start,
      requestSize,
      responseSize: 0,
    };
  }

  await recordAnalytics(result, payload);

  return NextResponse.json(result);
}
