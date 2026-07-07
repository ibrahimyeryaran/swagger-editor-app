'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { resolveMaybeRef, type Endpoint } from '@/lib/openapi/endpoints';
import { buildSample } from '@/lib/openapi/sample';
import type { OpenApiDocument } from '@/lib/openapi/types';
import { formatBytes, formatDuration, prepareRequest, prettifyBody } from '@/lib/request';
import { generateCurl, type CurlRequest } from '@/lib/curl';
import type { ProxyResult } from '@/app/api/proxy/route';
import { useToast } from '@/components/toast/ToastProvider';
import styles from './TryItOut.module.css';

interface TryItOutProps {
  doc: OpenApiDocument;
  endpoint: Endpoint;
  serverUrls: string[];
}

const BODYLESS_METHODS = new Set(['get', 'head']);

export function TryItOut({ doc, endpoint, serverUrls }: TryItOutProps) {
  const t = useTranslations('viewer');
  const { showToast } = useToast();

  const { method, path, operation, parameters } = endpoint;
  const requestBody = operation.requestBody
    ? resolveMaybeRef(doc, operation.requestBody)
    : undefined;
  const contentTypes = Object.keys(requestBody?.content ?? {});
  const hasBody = contentTypes.length > 0 && !BODYLESS_METHODS.has(method);

  const [baseUrl, setBaseUrl] = useState(serverUrls[0] ?? '');
  const [values, setValues] = useState<Record<string, string>>({});
  const [contentType, setContentType] = useState(contentTypes[0] ?? 'application/json');
  const [body, setBody] = useState(() => {
    if (!hasBody) {
      return '';
    }
    const media = requestBody?.content?.[contentTypes[0]];
    const example = media?.example ?? buildSample(doc, media?.schema);
    return typeof example === 'string' ? example : JSON.stringify(example, null, 2);
  });
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ProxyResult | null>(null);
  const [curl, setCurl] = useState<string | null>(null);

  const buildRequest = (): CurlRequest => {
    const prepared = prepareRequest(baseUrl, path, parameters, values);
    const headers = { ...prepared.headers };
    if (hasBody && body !== '') {
      headers['Content-Type'] = contentType;
    }
    return {
      method: method.toUpperCase(),
      url: prepared.url,
      headers,
      body: hasBody && body !== '' ? body : undefined,
    };
  };

  const handleExecute = async () => {
    setExecuting(true);
    setResult(null);
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequest()),
      });
      if (!response.ok) {
        throw new Error(`Proxy responded with status ${response.status}`);
      }
      const data: ProxyResult = await response.json();
      setResult(data);
    } catch {
      showToast(t('networkError'), 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleGenerateCurl = () => {
    setCurl(generateCurl(buildRequest()));
  };

  const handleCopyCurl = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      showToast(t('copied'), 'success');
    } catch {
      showToast(t('copyFailed'), 'error');
    }
  };

  const setValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className={styles.tryItOut}>
      <h5 className={styles.heading}>{t('tryItOut')}</h5>

      <label className={styles.field}>
        <span className={styles.label}>{t('baseUrl')}</span>
        <input
          className={styles.input}
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://api.example.com"
        />
      </label>

      {parameters.map((param) => {
        const key = `${param.in}:${param.name}`;
        return (
          <label key={key} className={styles.field}>
            <span className={styles.label}>
              {param.name}
              <span className={styles.paramMeta}>
                {' '}
                ({param.in}
                {param.required ? ', *' : ''})
              </span>
            </span>
            <input
              className={styles.input}
              value={values[key] ?? ''}
              onChange={(event) => setValue(key, event.target.value)}
              placeholder={param.description ?? ''}
            />
          </label>
        );
      })}

      {hasBody && (
        <>
          {contentTypes.length > 1 && (
            <label className={styles.field}>
              <span className={styles.label}>Content-Type</span>
              <select
                className={styles.input}
                value={contentType}
                onChange={(event) => setContentType(event.target.value)}
              >
                {contentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={styles.field}>
            <span className={styles.label}>{t('body')}</span>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={body}
              rows={6}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>
        </>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btnPrimary btnSmall"
          onClick={handleExecute}
          disabled={executing || baseUrl.trim() === ''}
        >
          {executing ? t('executing') : t('execute')}
        </button>
        <button type="button" className="btn btnOutline btnSmall" onClick={handleGenerateCurl}>
          {t('generateCurl')}
        </button>
      </div>

      {curl !== null && (
        <div className={styles.curlBlock}>
          <div className={styles.curlHeader}>
            <span className={styles.label}>cURL</span>
            <button
              type="button"
              className="btn btnOutline btnSmall"
              onClick={() => handleCopyCurl(curl)}
            >
              {t('copyCurl')}
            </button>
          </div>
          <pre className={styles.pre}>{curl}</pre>
        </div>
      )}

      {result && (
        <div className={styles.responseBlock} data-testid="response-panel">
          <h6 className={styles.responseTitle}>{t('response')}</h6>
          {result.ok ? (
            <>
              <p className={styles.responseMeta}>
                <span
                  className={`${styles.statusBadge} ${
                    result.status !== undefined && result.status < 400
                      ? styles.statusOk
                      : styles.statusFail
                  }`}
                >
                  {t('responseStatus')}: {result.status} {result.statusText}
                </span>
                <span>
                  {t('duration')}: {formatDuration(result.durationMs)}
                </span>
                <span>{formatBytes(result.responseSize)}</span>
              </p>
              {result.headers && Object.keys(result.headers).length > 0 && (
                <details className={styles.headers}>
                  <summary>{t('responseHeaders')}</summary>
                  <pre className={styles.pre}>
                    {Object.entries(result.headers)
                      .map(([name, value]) => `${name}: ${value}`)
                      .join('\n')}
                  </pre>
                </details>
              )}
              <p className={styles.label}>{t('responseBody')}</p>
              <pre className={styles.pre}>{prettifyBody(result.body ?? '')}</pre>
            </>
          ) : (
            <p className={styles.errorText}>
              {t('networkError')}: {result.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
