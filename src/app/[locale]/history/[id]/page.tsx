import { getTranslations } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatTimestamp, isFailedRequest, type HistoryRow } from '@/lib/history';
import { formatBytes, formatDuration } from '@/lib/request';
import styles from '../history.module.css';

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
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
    .eq('id', id)
    .maybeSingle<HistoryRow>();

  return (
    <div className={styles.page}>
      <Link href="/history" className={styles.backLink}>
        ← {t('backToHistory')}
      </Link>
      <h1 className={styles.title}>{t('detailTitle')}</h1>

      {!data ? (
        <div className={`card ${styles.empty}`}>
          <p className={styles.emptyTitle}>{t('notFound')}</p>
        </div>
      ) : (
        <div className={`card ${styles.detailCard}`}>
          <dl className={styles.detailList}>
            <dt>{t('timestamp')}</dt>
            <dd>{formatTimestamp(data.created_at, locale)}</dd>

            <dt>{t('method')}</dt>
            <dd>
              <span className={styles.method}>{data.method}</span>
            </dd>

            <dt>{t('endpoint')}</dt>
            <dd className={styles.url}>{data.url}</dd>

            <dt>{t('statusCode')}</dt>
            <dd>
              <span
                className={`${styles.status} ${
                  isFailedRequest(data) ? styles.statusFail : styles.statusOk
                }`}
              >
                {data.status_code ?? '—'}
              </span>
            </dd>

            <dt>{t('duration')}</dt>
            <dd>{formatDuration(data.duration_ms)}</dd>

            <dt>{t('requestSize')}</dt>
            <dd>{formatBytes(data.request_size)}</dd>

            <dt>{t('responseSize')}</dt>
            <dd>{formatBytes(data.response_size)}</dd>

            <dt>{t('errorDetails')}</dt>
            <dd>{data.error ?? t('noError')}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
