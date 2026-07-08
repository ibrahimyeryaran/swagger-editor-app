export interface HistoryRow {
  id: string;
  method: string;
  url: string;
  status_code: number | null;
  duration_ms: number;
  request_size: number;
  response_size: number;
  error: string | null;
  created_at: string;
}

export interface HistoryStats {
  total: number;
  avgDurationMs: number;
  errorCount: number;
}

/** A request is considered failed when it has no 2xx/3xx status. */
export function isFailedRequest(row: Pick<HistoryRow, 'status_code' | 'error'>): boolean {
  if (row.error !== null && row.error !== '') {
    return true;
  }
  return row.status_code === null || row.status_code >= 400;
}

export function computeStats(rows: HistoryRow[]): HistoryStats {
  if (rows.length === 0) {
    return { total: 0, avgDurationMs: 0, errorCount: 0 };
  }
  const totalDuration = rows.reduce((sum, row) => sum + row.duration_ms, 0);
  return {
    total: rows.length,
    avgDurationMs: totalDuration / rows.length,
    errorCount: rows.filter(isFailedRequest).length,
  };
}

export function formatTimestamp(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(iso));
}
