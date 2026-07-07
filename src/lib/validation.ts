const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthErrorKey =
  | 'emailRequired'
  | 'emailInvalid'
  | 'passwordRequired'
  | 'passwordLength'
  | 'passwordLetter'
  | 'passwordDigit'
  | 'passwordSpecial'
  | 'passwordMismatch';

export function validateEmail(email: string): AuthErrorKey | null {
  if (email.trim() === '') {
    return 'emailRequired';
  }
  if (!EMAIL_PATTERN.test(email)) {
    return 'emailInvalid';
  }
  return null;
}

/**
 * Password strength: min 8 chars, at least one letter, one digit and one
 * special character. Unicode letters and digits are supported.
 */
export function validatePassword(password: string): AuthErrorKey | null {
  if (password === '') {
    return 'passwordRequired';
  }
  if ([...password].length < 8) {
    return 'passwordLength';
  }
  if (!/\p{L}/u.test(password)) {
    return 'passwordLetter';
  }
  if (!/\p{Nd}/u.test(password)) {
    return 'passwordDigit';
  }
  if (!/[^\p{L}\p{Nd}\s]/u.test(password)) {
    return 'passwordSpecial';
  }
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmation: string
): AuthErrorKey | null {
  if (password !== confirmation) {
    return 'passwordMismatch';
  }
  return null;
}
