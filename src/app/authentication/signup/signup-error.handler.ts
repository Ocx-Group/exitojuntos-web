import { TranslateService } from '@ngx-translate/core';
import { normalizeText } from './signup.helpers';

interface ParsedError {
  code?: number;
  status?: number;
  message?: string;
  error?: string | { message?: string };
}

function parseError(error: unknown): ParsedError {
  if (!error || typeof error !== 'object') {
    return {};
  }
  return error as ParsedError;
}

function extractMessage(parsedError: ParsedError): string {
  if (
    parsedError.error &&
    typeof parsedError.error === 'object' &&
    parsedError.error.message
  ) {
    return parsedError.error.message;
  }
  if (
    parsedError.message &&
    !parsedError.message.includes('Http failure')
  ) {
    return parsedError.message;
  }
  if (typeof parsedError.error === 'string') {
    return parsedError.error;
  }
  return '';
}

function mapConflictKey(normalizedMessage: string): string | null {
  if (
    normalizedMessage.includes('usuario') ||
    normalizedMessage.includes('username') ||
    normalizedMessage.includes('user name') ||
    normalizedMessage.includes('nombre de usuario')
  ) {
    return 'SIGNUP.USERNAME_ALREADY_REGISTERED';
  }
  if (
    normalizedMessage.includes('telefono') ||
    normalizedMessage.includes('phone') ||
    normalizedMessage.includes('telephone')
  ) {
    return 'SIGNUP.PHONE_ALREADY_REGISTERED';
  }
  if (
    normalizedMessage.includes('correo') ||
    normalizedMessage.includes('email') ||
    normalizedMessage.includes('e-mail') ||
    normalizedMessage.includes('mail')
  ) {
    return 'SIGNUP.EMAIL_ALREADY_REGISTERED';
  }
  return null;
}

export function buildSignupErrorMessage(
  error: unknown,
  translate: TranslateService,
): string {
  const parsedError = parseError(error);
  const statusCode = parsedError.code ?? parsedError.status;
  const message = extractMessage(parsedError);

  if (statusCode === 409) {
    const conflictKey = mapConflictKey(normalizeText(message));
    if (conflictKey) {
      return translate.instant(conflictKey);
    }
  }

  if (message) {
    return message;
  }

  return translate.instant('SIGNUP.REGISTRATION_ERROR');
}
