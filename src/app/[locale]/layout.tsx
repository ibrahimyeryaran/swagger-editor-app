import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { ToastProvider } from '@/components/toast/ToastProvider';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Swagger Editor App',
  description: 'Swagger/OpenAPI UI with REST client capabilities',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <ToastProvider>
            <Header userEmail={user?.email ?? null} />
            <main>{children}</main>
            <Footer />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
