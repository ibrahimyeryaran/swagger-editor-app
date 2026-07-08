import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './Footer.module.css';

export function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.copy}>{t('rights', { year })}</span>
        <nav className={styles.links}>
          <Link href="/about" className={styles.link}>
            {t('about')}
          </Link>
          <a
            className={styles.link}
            href="https://rs.school/courses/reactjs"
            target="_blank"
            rel="noreferrer"
          >
            {t('course')}
          </a>
          <a
            className={styles.link}
            href="https://github.com/ibrahimyeryaran"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
