export const EMAIL_MAX_LENGTH = 254;

const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export type EmailValidationResult = {
  ok: boolean;
  error: string | null;
  normalized: string;
};

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const value = normalizeEmail(email);
  if (!value || value.length > EMAIL_MAX_LENGTH) return false;
  if (value.includes('..')) return false;

  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) return false;

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
    return false;
  }

  return EMAIL_PATTERN.test(value);
}

export function validateEmailAddress(email: string): EmailValidationResult {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { ok: false, error: 'Email is required', normalized: '' };
  }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Please enter a valid email address', normalized };
  }
  return { ok: true, error: null, normalized };
}
