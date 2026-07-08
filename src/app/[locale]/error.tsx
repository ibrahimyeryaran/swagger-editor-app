'use client';

import { useTranslations } from 'next-intl';
import styles from './error.module.css';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('errors');

  return (
    <div className={styles.wrapper}>
      <div className={`card ${styles.card}`}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.description}>{t('description')}</p>
        <button type="button" className="btn btnPrimary" onClick={reset}>
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
