'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { validateSpec } from '@/lib/openapi/validate';
import { convertSpec, type SpecFormat } from '@/lib/openapi/format';
import { useToast } from '@/components/toast/ToastProvider';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { ValidationPanel } from '@/components/editor/ValidationPanel';
import { SwaggerViewer } from '@/components/viewer/SwaggerViewer';
import styles from './Workspace.module.css';

interface WorkspaceProps {
  initialContent: string;
  isAuthenticated: boolean;
  restored: boolean;
}

const FORMATS: SpecFormat[] = ['json', 'yaml'];

export function Workspace({ initialContent, isAuthenticated, restored }: WorkspaceProps) {
  const t = useTranslations('editor');
  const tViewer = useTranslations('viewer');
  const { showToast } = useToast();

  const [code, setCode] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const restoredNotified = useRef(false);

  const validation = useMemo(() => validateSpec(code), [code]);
  const format = validation.format;

  useEffect(() => {
    if (restored && !restoredNotified.current) {
      restoredNotified.current = true;
      showToast(t('restored'), 'info');
    }
  }, [restored, showToast, t]);

  const handleFormatSwitch = (target: SpecFormat) => {
    if (target === format) {
      return;
    }
    try {
      setCode(convertSpec(code, target));
    } catch {
      showToast(t('convertFailed'), 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/schema', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: code, format }),
      });
      if (!response.ok) {
        throw new Error(`Save failed with status ${response.status}`);
      }
      showToast(t('saved'), 'success');
    } catch {
      showToast(t('saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.split}>
      <section className={`card ${styles.pane}`} aria-label={t('title')}>
        <div className={styles.toolbar}>
          <h2 className={styles.paneTitle}>{t('title')}</h2>
          <div className={styles.toolbarActions}>
            <div
              className={styles.formatSwitch}
              role="group"
              aria-label={t('detected', { format })}
            >
              {FORMATS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.formatButton} ${format === option ? styles.formatActive : ''}`}
                  onClick={() => handleFormatSwitch(option)}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            {isAuthenticated && (
              <button
                type="button"
                className="btn btnOutline btnSmall"
                onClick={handleSave}
                disabled={saving || !validation.valid}
              >
                {saving ? t('saving') : t('save')}
              </button>
            )}
          </div>
        </div>
        <div className={styles.editorArea}>
          <CodeEditor value={code} format={format} onChange={setCode} />
        </div>
        <ValidationPanel validation={validation} />
      </section>

      <section className={`card ${styles.pane}`} aria-label={tViewer('title')}>
        <div className={styles.toolbar}>
          <h2 className={styles.paneTitle}>{tViewer('title')}</h2>
        </div>
        <div className={styles.viewerArea}>
          <SwaggerViewer doc={validation.doc} />
        </div>
      </section>
    </div>
  );
}
