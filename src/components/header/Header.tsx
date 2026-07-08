'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SignOutButton } from './SignOutButton';
import styles from './Header.module.css';

const SCROLL_THRESHOLD = 10;

export function Header({ userEmail }: { userEmail: string | null }) {
  const t = useTranslations('header');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`} data-testid="header">
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">
              <rect width="64" height="64" rx="14" fill="#2c3252" />
              <path
                d="M24 18l-10 14 10 14"
                fill="none"
                stroke="#9d92f5"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M40 18l10 14-10 14"
                fill="none"
                stroke="#49cc90"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t('appName')}</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/about" className={styles.navLink}>
              {t('about')}
            </Link>
          </nav>
        </div>
        <div className={styles.right}>
          <LanguageSwitcher />
          {userEmail ? (
            <>
              <Link href="/history" className="btn btnGhost btnSmall">
                {t('history')}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/signin" className="btn btnGhost btnSmall">
                {t('signIn')}
              </Link>
              <Link href="/signup" className="btn btnPrimary btnSmall">
                {t('signUp')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
