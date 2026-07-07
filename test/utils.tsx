import { render, type RenderResult } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import messages from '../messages/en.json';

export function renderWithIntl(ui: ReactNode): RenderResult {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

export function wrapWithIntl(ui: ReactNode): ReactNode {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

export function getMessage(namespace: string, key: string): string {
  const segments = `${namespace}.${key}`.split('.');
  let current: unknown = messages;
  for (const segment of segments) {
    current = (current as Record<string, unknown> | undefined)?.[segment];
  }
  return typeof current === 'string' ? current : segments.join('.');
}

/** Minimal replacement for next-intl's server-side getTranslations in tests. */
export function createTranslator(namespace: string) {
  return (key: string, values?: Record<string, string | number>) => {
    let message = getMessage(namespace, key);
    if (values) {
      for (const [name, value] of Object.entries(values)) {
        message = message.replace(`{${name}}`, String(value));
      }
    }
    return message;
  };
}
