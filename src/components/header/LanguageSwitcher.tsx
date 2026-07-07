'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import styles from './LanguageSwitcher.module.css';

const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  tr: 'TR',
};

export function LanguageSwitcher() {
  const t = useTranslations('header');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className={styles.wrapper}>
      <span className="visuallyHidden">{t('language')}</span>
      <select
        className={styles.select}
        value={locale}
        onChange={(event) => router.replace(pathname, { locale: event.target.value })}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code] ?? code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
