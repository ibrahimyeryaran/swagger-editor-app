'use client';

import { useTranslations } from 'next-intl';
import type { ValidationOutcome } from '@/lib/openapi/validate';
import styles from './ValidationPanel.module.css';

export function ValidationPanel({ validation }: { validation: ValidationOutcome }) {
  const t = useTranslations('editor');

  if (validation.valid) {
    return (
      <div className={`${styles.panel} ${styles.valid}`} data-testid="validation-panel">
        <span className={styles.badge}>✓</span>
        <span>{t('valid')}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.panel} ${styles.invalid}`} data-testid="validation-panel">
      <p className={styles.heading}>{t('invalid')}</p>
      <ul className={styles.list}>
        {validation.errors.map((error, index) => (
          <li key={`${index}-${error.message}`}>
            {error.line !== undefined && (
              <span className={styles.line}>{t('line', { line: error.line })}: </span>
            )}
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
