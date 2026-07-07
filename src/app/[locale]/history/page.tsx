import { getTranslations } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { computeStats, formatTimestamp, isFailedRequest, type HistoryRow } from '@/lib/history';
import { formatDuration } from '@/lib/request';
import styles from './history.module.css';

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/', locale });
  }

  const t = await getTranslations('history');
  const { data } = await supabase
    .from('request_history')
    .select('*')
    .order('created_at', { ascending: false });

  const rows: HistoryRow[] = data ?? [];
  const stats = computeStats(rows);

  if (rows.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>{t('title')}</h1>
        <div className={`card ${styles.empty}`}>
          <p className={styles.emptyTitle}>{t('empty')}</p>
          <p className={styles.emptyHint}>{t('emptyHint')}</p>
          <div className={styles.emptyActions}>
            <Link href="/" className="btn btnPrimary">
              {t('goToEditor')}
            </Link>
            <Link href="/" className="btn btnOutline">
              {t('goToViewer')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.subtitle}>{t('subtitle')}</p>

      <div className={styles.stats}>
        <div className={`card ${styles.statCard}`}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>{t('totalRequests')}</span>
        </div>
        <div className={`card ${styles.statCard}`}>
          <span className={styles.statValue}>{formatDuration(stats.avgDurationMs)}</span>
          <span className={styles.statLabel}>{t('avgDuration')}</span>
        </div>
        <div className={`card ${styles.statCard}`}>
          <span className={styles.statValue}>{stats.errorCount}</span>
          <span className={styles.statLabel}>{t('errorCount')}</span>
        </div>
      </div>

      <div className={`card ${styles.tableCard}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('timestamp')}</th>
              <th>{t('method')}</th>
              <th>{t('endpoint')}</th>
              <th>{t('statusCode')}</th>
              <th>{t('duration')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={styles.nowrap}>{formatTimestamp(row.created_at, locale)}</td>
                <td>
                  <span className={styles.method}>{row.method}</span>
                </td>
                <td className={styles.url}>{row.url}</td>
                <td>
                  <span
                    className={`${styles.status} ${
                      isFailedRequest(row) ? styles.statusFail : styles.statusOk
                    }`}
                  >
                    {row.status_code ?? '—'}
                  </span>
                </td>
                <td className={styles.nowrap}>{formatDuration(row.duration_ms)}</td>
                <td>
                  <Link href={`/history/${row.id}`}>{t('details')}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
