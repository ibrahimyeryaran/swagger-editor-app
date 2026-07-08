'use client';

import dynamic from 'next/dynamic';
import type { SpecFormat } from '@/lib/openapi/format';
import styles from './CodeEditor.module.css';

const CodeMirrorEditor = dynamic(() => import('./CodeMirrorEditor'), {
  ssr: false,
  loading: () => <div className={styles.loading} />,
});

export interface CodeEditorProps {
  value: string;
  format: SpecFormat;
  onChange: (value: string) => void;
}

export function CodeEditor(props: CodeEditorProps) {
  return (
    <div className={styles.wrapper}>
      <CodeMirrorEditor {...props} />
    </div>
  );
}
