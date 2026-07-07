'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast/ToastProvider';

export function SignOutButton() {
  const t = useTranslations('header');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    setPending(false);
    if (error) {
      showToast(tErrors('description'), 'error');
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <button
      type="button"
      className="btn btnPrimary btnSmall"
      onClick={handleSignOut}
      disabled={pending}
    >
      {t('signOut')}
    </button>
  );
}
