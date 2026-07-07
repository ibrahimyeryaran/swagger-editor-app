import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './error.module.css';

export default function NotFoundPage() {
  const t = useTranslations('errors');

  return (
    <div className={styles.wrapper}>
      <div className={`card ${styles.card}`}>
        <h1 className={styles.title}>{t('notFoundTitle')}</h1>
        <p className={styles.description}>{t('notFoundDescription')}</p>
        <Link href="/" className="btn btnPrimary">
          {t('goHome')}
        </Link>
      </div>
    </div>
  );
}
