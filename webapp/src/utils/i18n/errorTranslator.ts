import type { TFunction } from 'i18next';

/**
 * Tipo para un error de campo específico
 * Contiene un código de error y/o un mensaje de error
 */
type FieldError = {
  code?: string;
  message?: string;
};

/**
 * Estructura del payload de error de la API
 * Soporta múltiples formatos de respuesta de error del servidor
 * 
 * Ejemplo de estructuras soportadas:
 * { error_code: "AUTH_INVALID_CREDENTIALS", message: "Invalid login" }
 * { errors: { username: { code: "USERNAME_TAKEN", message: "Already exists" } } }
 * { error: "Request failed" }
 */
export type ApiErrorPayload = {
  error_code?: string;        // Código de error principal
  code?: string;              // Código de error alternativo
  error?: string;             // Mensaje de error genérico
  message?: string;           // Mensaje de error alternativo
  errors?: Record<string, FieldError | string>;  // Errores de campos específicos
};

/**
 * Extrae el primer error de campo del objeto errors del payload
 * 
 * @param payload - El payload de error de la API
 * @returns El primer campo de error encontrado, o undefined si no hay
 * 
 * Casos de uso:
 * - Si errors = { username: { code: "USERNAME_TAKEN", message: "..." } }
 *   Retorna: { code: "USERNAME_TAKEN", message: "..." }
 * - Si errors = { email: "Invalid email format" }
 *   Retorna: { message: "Invalid email format" }
 * - Si no hay errors o está vacío, retorna undefined
 */
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

/**
 * Traduce errores de la API a mensajes localizados usando i18next
 * 
 * ALGORITMO DE RESOLUCIÓN (en orden de prioridad):
 * 
 * 1. BUSCAR CÓDIGO DE ERROR:
 *    - Intenta usar: error_code > code > fieldError.code
 *    - Si encuentra un código, busca su traducción: errors.codes.{CÓDIGO}
 *    - Si no hay traducción, usa fallbackMessage
 * 
 * 2. FALLBACK A MENSAJE:
 *    - Si no hay código, usa: fieldError.message > payload.error > payload.message > fallbackKey
 *    - fallbackKey por defecto es 'errors.generic'
 * 
 * @param payload - El objeto de error de la API (puede ser undefined)
 * @param t - Función de traducción de i18next (TFunction)
 * @param fallbackKey - Clave de traducción para el fallback genérico (default: 'errors.generic')
 * @returns Mensaje de error traducido y localizado
 * 
 * EJEMPLOS DE USO:
 * 
 * Ejemplo 1 - Con código de error:
 *   const payload = { error_code: 'AUTH_INVALID_CREDENTIALS', message: 'Wrong password' }
 *   translateApiError(payload, t)
 *   → Busca t('errors.codes.AUTH_INVALID_CREDENTIALS')
 *   → Si no existe, retorna 'Wrong password'
 * 
 * Ejemplo 2 - Con errores de campo:
 *   const payload = { errors: { username: { code: 'USERNAME_TAKEN', message: 'Already exists' } } }
 *   translateApiError(payload, t)
 *   → Extrae el primer error: { code: 'USERNAME_TAKEN', message: 'Already exists' }
 *   → Busca t('errors.codes.USERNAME_TAKEN')
 * 
 * Ejemplo 3 - Payload vacío:
 *   translateApiError(undefined, t)
 *   → Retorna t('errors.generic') - error genérico por defecto
 * 
 * Ejemplo 4 - Fallback personalizado:
 *   translateApiError(undefined, t, 'errors.codes.USER_NOT_FOUND')
 *   → Retorna t('errors.codes.USER_NOT_FOUND')
 */
export const translateApiError = (
  payload: ApiErrorPayload | undefined,
  t: TFunction,
  fallbackKey = 'errors.generic'
): string => {
  // Extrae el primer error de campo si existen errores de validación
  const fieldError = extractFieldError(payload);
  
  // Resuelve el código de error con prioridad: error_code > code > fieldError.code
  const resolvedCode = payload?.error_code
    ?? payload?.code
    ?? fieldError?.code;
  
  // Resuelve el mensaje de fallback: fieldError.message > payload.error > payload.message > fallbackKey traducida
  const fallbackMessage = fieldError?.message 
    ?? payload?.error 
    ?? payload?.message 
    ?? t(fallbackKey);

  // Si hay un código de error, intenta traducirlo
  // Si la traducción no existe, usa fallbackMessage como valor por defecto
  if (resolvedCode) {
    return t(`errors.codes.${resolvedCode}`, { defaultValue: fallbackMessage });
  }

  // Si no hay código, retorna el mensaje de fallback
  return fallbackMessage;
};
