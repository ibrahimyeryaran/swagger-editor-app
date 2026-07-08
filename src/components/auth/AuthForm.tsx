'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast/ToastProvider';
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  type AuthErrorKey,
} from '@/lib/validation';
import styles from './AuthForm.module.css';

export type AuthMode = 'signin' | 'signup';

interface FieldErrors {
  email?: AuthErrorKey;
  password?: AuthErrorKey;
  confirm?: AuthErrorKey;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSignUp = mode === 'signup';

  const validate = (): boolean => {
    const next: FieldErrors = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirm: isSignUp ? (validateConfirmPassword(password, confirm) ?? undefined) : undefined,
    };
    setErrors(next);
    return !next.email && !next.password && !next.confirm;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    if (!validate()) {
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setPending(false);

    if (error) {
      setServerError(error.message);
      showToast(error.message, 'error');
      return;
    }

    if (isSignUp && !data.session) {
      showToast(t('confirmEmail'), 'info');
      router.push('/signin');
      return;
    }

    if (isSignUp) {
      showToast(t('signUpSuccess'), 'success');
    }
    router.push('/');
    router.refresh();
  };

  return (
    <form className={`card ${styles.form}`} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.title}>{isSignUp ? t('signUpTitle') : t('signInTitle')}</h1>

      <label className={styles.field}>
        <span className={styles.label}>{t('email')}</span>
        <input
          type="email"
          name="email"
          className={styles.input}
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <span className={styles.error}>{t(`errors.${errors.email}`)}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{t('password')}</span>
        <input
          type="password"
          name="password"
          className={styles.input}
          value={password}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && <span className={styles.error}>{t(`errors.${errors.password}`)}</span>}
      </label>

      {isSignUp && (
        <label className={styles.field}>
          <span className={styles.label}>{t('confirmPassword')}</span>
          <input
            type="password"
            name="confirmPassword"
            className={styles.input}
            value={confirm}
            autoComplete="new-password"
            onChange={(event) => setConfirm(event.target.value)}
            aria-invalid={Boolean(errors.confirm)}
          />
          {errors.confirm && <span className={styles.error}>{t(`errors.${errors.confirm}`)}</span>}
        </label>
      )}

      {serverError && (
        <p className={styles.serverError} role="alert">
          {serverError}
        </p>
      )}

      <button type="submit" className="btn btnPrimary" disabled={pending}>
        {pending ? t('submitting') : isSignUp ? t('submitSignUp') : t('submitSignIn')}
      </button>

      <p className={styles.switch}>
        {isSignUp ? t('haveAccount') : t('noAccount')}{' '}
        <Link href={isSignUp ? '/signin' : '/signup'}>
          {isSignUp ? t('signInTitle') : t('signUpTitle')}
        </Link>
      </p>
    </form>
  );
}
