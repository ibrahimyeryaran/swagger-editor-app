'use client';

import { useTranslations } from 'next-intl';
import { buildSample, schemaToDisplay } from '@/lib/openapi/sample';
import type { JsonValue, MediaTypeObject, OpenApiDocument } from '@/lib/openapi/types';
import styles from './SchemaExample.module.css';

interface SchemaExampleProps {
  doc: OpenApiDocument;
  media: MediaTypeObject;
  /** Swagger 2.0 response examples keyed by media type */
  legacyExamples?: Record<string, JsonValue>;
}

function pickExample(
  doc: OpenApiDocument,
  media: MediaTypeObject,
  legacyExamples?: Record<string, JsonValue>
): JsonValue {
  if (media.example !== undefined) {
    return media.example;
  }
  if (media.examples) {
    const first = Object.values(media.examples)[0];
    if (first?.value !== undefined) {
      return first.value;
    }
  }
  if (legacyExamples) {
    const first = Object.values(legacyExamples)[0];
    if (first !== undefined) {
      return first;
    }
  }
  return buildSample(doc, media.schema);
}

export function SchemaExample({ doc, media, legacyExamples }: SchemaExampleProps) {
  const t = useTranslations('viewer');

  return (
    <div className={styles.grid}>
      <div>
        <p className={styles.label}>{t('schema')}</p>
        <pre className={styles.block}>
          {JSON.stringify(schemaToDisplay(doc, media.schema), null, 2)}
        </pre>
      </div>
      <div>
        <p className={styles.label}>{t('example')}</p>
        <pre className={styles.block}>
          {JSON.stringify(pickExample(doc, media, legacyExamples), null, 2)}
        </pre>
      </div>
    </div>
  );
}
