import { describe, expect, it } from 'vitest';
import { validateConfirmPassword, validateEmail, validatePassword } from './validation';

describe('validateEmail', () => {
  it('requires a non-empty email', () => {
    expect(validateEmail('')).toBe('emailRequired');
    expect(validateEmail('   ')).toBe('emailRequired');
  });

  it('rejects malformed emails', () => {
    expect(validateEmail('plainaddress')).toBe('emailInvalid');
    expect(validateEmail('user@host')).toBe('emailInvalid');
    expect(validateEmail('user name@host.com')).toBe('emailInvalid');
  });

  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBeNull();
    expect(validateEmail('a.b+c@sub.domain.org')).toBeNull();
  });
});

describe('validatePassword', () => {
  it('requires a non-empty password', () => {
    expect(validatePassword('')).toBe('passwordRequired');
  });

  it('requires at least 8 characters', () => {
    expect(validatePassword('a1!')).toBe('passwordLength');
  });

  it('requires at least one letter', () => {
    expect(validatePassword('12345678!')).toBe('passwordLetter');
  });

  it('requires at least one digit', () => {
    expect(validatePassword('abcdefgh!')).toBe('passwordDigit');
  });

  it('requires at least one special character', () => {
    expect(validatePassword('abcdefg1')).toBe('passwordSpecial');
  });

  it('accepts a strong password', () => {
    expect(validatePassword('abcdef1!')).toBeNull();
  });

  it('supports unicode letters and digits', () => {
    expect(validatePassword('şifrem1!')).toBeNull();
    expect(validatePassword('пароль7$')).toBeNull();
  });
});

describe('validateConfirmPassword', () => {
  it('detects mismatching passwords', () => {
    expect(validateConfirmPassword('abcdef1!', 'different')).toBe('passwordMismatch');
  });

  it('accepts matching passwords', () => {
    expect(validateConfirmPassword('abcdef1!', 'abcdef1!')).toBeNull();
  });
});
