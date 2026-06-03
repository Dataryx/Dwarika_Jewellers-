export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS_HINT =
  'At least 8 characters with uppercase, lowercase, a number, and a special character.';

export function validatePasswordStrength(password) {
  const value = String(password || '');
  if (!value) {
    return { ok: false, error: 'Password is required' };
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!/[a-z]/.test(value)) {
    return { ok: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(value)) {
    return { ok: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(value)) {
    return { ok: false, error: 'Password must contain at least one number' };
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return { ok: false, error: 'Password must contain at least one special character (!@#$…)' };
  }
  return { ok: true, error: null };
}
