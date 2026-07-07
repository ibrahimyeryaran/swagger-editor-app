'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { resolveMaybeRef, type Endpoint } from '@/lib/openapi/endpoints';
import type { OpenApiDocument } from '@/lib/openapi/types';
import { SchemaExample } from './SchemaExample';
import { TryItOut } from './TryItOut';
import styles from './EndpointItem.module.css';

interface EndpointItemProps {
  doc: OpenApiDocument;
  endpoint: Endpoint;
  serverUrls: string[];
}

function statusClass(status: string): string {
  if (status.startsWith('2')) {
    return styles.status2xx;
  }
  if (status.startsWith('4') || status.startsWith('5')) {
    return styles.statusError;
  }
  return styles.statusOther;
}

export function EndpointItem({ doc, endpoint, serverUrls }: EndpointItemProps) {
  const t = useTranslations('viewer');
  const [open, setOpen] = useState(false);

  const { method, path, operation, parameters } = endpoint;
  const requestBody = operation.requestBody
    ? resolveMaybeRef(doc, operation.requestBody)
    : undefined;
  const responses = Object.entries(operation.responses ?? {});

  return (
    <li className={`${styles.item} ${styles[`border_${method}`] ?? ''}`}>
      <button
        type="button"
        className={styles.summaryRow}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className={`${styles.method} ${styles[method] ?? ''}`}>{method.toUpperCase()}</span>
        <code className={styles.path}>{path}</code>
        {operation.summary && <span className={styles.opSummary}>{operation.summary}</span>}
        <span className={styles.chevron} aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div className={styles.details}>
          {operation.description && <p className={styles.description}>{operation.description}</p>}

          <h5 className={styles.sectionHeading}>{t('parameters')}</h5>
          {parameters.length === 0 ? (
            <p className={styles.muted}>{t('noParameters')}</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('location')}</th>
                    <th>{t('type')}</th>
                    <th>{t('required')}</th>
                    <th>{t('description')}</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param) => (
                    <tr key={`${param.in}-${param.name}`}>
                      <td>
                        <code>{param.name}</code>
                      </td>
                      <td>
                        <span className={styles.paramIn}>{param.in}</span>
                      </td>
                      <td>{param.schema?.type ?? param.type ?? '—'}</td>
                      <td>{param.required ? t('yes') : t('no')}</td>
                      <td>{param.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {requestBody?.content && (
            <>
              <h5 className={styles.sectionHeading}>{t('requestBody')}</h5>
              {Object.entries(requestBody.content).map(([mediaType, media]) => (
                <div key={mediaType}>
                  <p className={styles.mediaType}>{mediaType}</p>
                  <SchemaExample doc={doc} media={media} />
                </div>
              ))}
            </>
          )}

          {responses.length > 0 && (
            <>
              <h5 className={styles.sectionHeading}>{t('responses')}</h5>
              {responses.map(([status, rawResponse]) => {
                const response = resolveMaybeRef(doc, rawResponse);
                return (
                  <div key={status} className={styles.response}>
                    <p className={styles.responseHeading}>
                      <span className={`${styles.statusBadge} ${statusClass(status)}`}>
                        {status}
                      </span>
                      <span className={styles.muted}>{response.description}</span>
                    </p>
                    {response.content &&
                      Object.entries(response.content).map(([mediaType, media]) => (
                        <div key={mediaType}>
                          <p className={styles.mediaType}>{mediaType}</p>
                          <SchemaExample doc={doc} media={media} />
                        </div>
                      ))}
                    {response.schema && (
                      <SchemaExample
                        doc={doc}
                        media={{ schema: response.schema }}
                        legacyExamples={response.examples}
                      />
                    )}
                  </div>
                );
              })}
            </>
          )}

          <TryItOut doc={doc} endpoint={endpoint} serverUrls={serverUrls} />
        </div>
      )}
    </li>
  );
}
