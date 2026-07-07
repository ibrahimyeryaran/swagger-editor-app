import { describe, expect, it } from 'vitest';
import { computeStats, formatTimestamp, isFailedRequest, type HistoryRow } from './history';

function row(overrides: Partial<HistoryRow>): HistoryRow {
  return {
    id: '1',
    method: 'GET',
    url: 'https://api.example.com',
    status_code: 200,
    duration_ms: 100,
    request_size: 0,
    response_size: 10,
    error: null,
    created_at: '2026-07-01T10:00:00Z',
    ...overrides,
  };
}

describe('isFailedRequest', () => {
  it('treats 2xx and 3xx as successful', () => {
    expect(isFailedRequest(row({ status_code: 200 }))).toBe(false);
    expect(isFailedRequest(row({ status_code: 301 }))).toBe(false);
  });

  it('treats 4xx, 5xx, missing status and errors as failed', () => {
    expect(isFailedRequest(row({ status_code: 404 }))).toBe(true);
    expect(isFailedRequest(row({ status_code: 500 }))).toBe(true);
    expect(isFailedRequest(row({ status_code: null }))).toBe(true);
    expect(isFailedRequest(row({ error: 'timeout' }))).toBe(true);
  });
});

describe('computeStats', () => {
  it('returns zeros for an empty list', () => {
    expect(computeStats([])).toEqual({ total: 0, avgDurationMs: 0, errorCount: 0 });
  });

  it('computes totals, averages and error counts', () => {
    const stats = computeStats([
      row({ duration_ms: 100 }),
      row({ duration_ms: 300, status_code: 500 }),
    ]);
    expect(stats.total).toBe(2);
    expect(stats.avgDurationMs).toBe(200);
    expect(stats.errorCount).toBe(1);
  });
});

describe('formatTimestamp', () => {
  it('formats an ISO timestamp for the locale', () => {
    const formatted = formatTimestamp('2026-07-01T10:00:00Z', 'en');
    expect(formatted).toContain('2026');
  });
});
