import type { TFunction } from 'i18next';

type FieldError = {
  code?: string;
  message?: string;
};

export type ApiErrorPayload = {
  error_code?: string;
  code?: string;
  error?: string;
  message?: string;
  errors?: Record<string, FieldError | string>;
};

const extractFieldError = (payload?: ApiErrorPayload): FieldError | undefined => {
  if (!payload?.errors) {
    return undefined;
  }

  const firstValue = Object.values(payload.errors)[0];
  if (!firstValue) {
    return undefined;
  }

  if (typeof firstValue === 'string') {
    return { message: firstValue };
  }

  return firstValue;
};

export const translateApiError = (
  payload: ApiErrorPayload | undefined,
  t: TFunction,
  fallbackKey = 'errors.generic'
): string => {
  const fieldError = extractFieldError(payload);
  const resolvedCode = payload?.error_code
    ?? payload?.code
    ?? fieldError?.code;
  const fallbackMessage = fieldError?.message ?? payload?.error ?? payload?.message ?? t(fallbackKey);

  if (resolvedCode) {
    return t(`errors.codes.${resolvedCode}`, { defaultValue: fallbackMessage });
  }

  return fallbackMessage;
};
