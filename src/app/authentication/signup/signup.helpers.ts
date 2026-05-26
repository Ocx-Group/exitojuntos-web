export interface GoogleProfilePayload {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

const COMBINING_MARKS_REGEX = /[̀-ͯ]/g;
const NON_ALPHANUMERIC_REGEX = /[^a-z0-9\s]/g;

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.split('+').join('').trim();
}

export function buildGoogleUsername(email: string, sub: string): string {
  const prefix =
    (email.split('@')[0] || 'usuario')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 40) || 'usuario';
  const suffix =
    sub.replace(/\D/g, '').slice(-6) || Date.now().toString().slice(-6);
  return `${prefix}.${suffix}`.slice(0, 50);
}

export function buildGooglePhone(sub: string): string {
  const digits = sub.replace(/\D/g, '').slice(-13);
  const padded = digits.padStart(13, '9');
  return `9${padded}`;
}

export function decodeGoogleProfile(idToken: string): GoogleProfilePayload {
  const [, encodedPayload] = idToken.split('.');
  if (!encodedPayload) {
    return {};
  }

  try {
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    const decodedProfile: unknown = JSON.parse(atob(padded));
    return decodedProfile as GoogleProfilePayload;
  } catch {
    return {};
  }
}

export function normalizeText(text: string): string {
  if (!text) return '';
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      // eslint-disable-next-line unicorn/prefer-string-replace-all -- replaceAll not available on all targeted browsers
      .replace(COMBINING_MARKS_REGEX, '')
      // eslint-disable-next-line unicorn/prefer-string-replace-all -- replaceAll not available on all targeted browsers
      .replace(NON_ALPHANUMERIC_REGEX, '')
      .trim()
  );
}
