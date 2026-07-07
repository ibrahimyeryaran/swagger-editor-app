'use client';

import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import type { CodeEditorProps } from './CodeEditor';

export default function CodeMirrorEditor({ value, format, onChange }: CodeEditorProps) {
  const extensions = useMemo(() => [format === 'json' ? json() : yaml()], [format]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      height="100%"
      style={{ height: '100%' }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        autocompletion: false,
      }}
    />
  );
}
