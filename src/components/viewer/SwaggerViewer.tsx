'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { extractEndpoints, getServerUrls } from '@/lib/openapi/endpoints';
import type { OpenApiDocument } from '@/lib/openapi/types';
import { EndpointItem } from './EndpointItem';
import styles from './SwaggerViewer.module.css';

export function SwaggerViewer({ doc }: { doc: OpenApiDocument | null }) {
  const t = useTranslations('viewer');

  const endpoints = useMemo(() => (doc ? extractEndpoints(doc) : []), [doc]);
  const serverUrls = useMemo(() => (doc ? getServerUrls(doc) : []), [doc]);

  if (!doc) {
    return <p className={styles.empty}>{t('noSchema')}</p>;
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.info}>
        <h3 className={styles.infoTitle}>
          {doc.info?.title}
          {doc.info?.version && <span className={styles.version}>v{doc.info.version}</span>}
        </h3>
        {doc.info?.description && <p className={styles.infoDescription}>{doc.info.description}</p>}
      </div>
      <h4 className={styles.sectionTitle}>
        {t('endpoints')} ({endpoints.length})
      </h4>
      <ul className={styles.list}>
        {endpoints.map((endpoint) => (
          <EndpointItem
            key={`${endpoint.method}-${endpoint.path}`}
            doc={doc}
            endpoint={endpoint}
            serverUrls={serverUrls}
          />
        ))}
      </ul>
    </div>
  );
}
