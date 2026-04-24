import { describe, it, expect } from 'vitest';
import { translateApiError, type ApiErrorPayload } from '../utils/i18n/errorTranslator';
import type { TFunction } from 'i18next';

/**
 * Mock TFunction - Simula la función t() de i18next para traducciones
 * Busca una clave en el diccionario y retorna su valor, o usa defaultValue si existe
 */
const createMockT = (translations: Record<string, string>): TFunction => {
  return ((key: string, options?: any) => {
    return translations[key] || options?.defaultValue || key;
  }) as TFunction;
};

describe('errorTranslator', () => {
  describe('translateApiError', () => {
    const mockT = createMockT({
      'errors.generic': 'Generic error occurred',
      'errors.codes.AUTH_INVALID_CREDENTIALS': 'Invalid credentials',
      'errors.codes.USERNAME_TAKEN': 'Username already taken',
      'errors.codes.PASSWORD_TOO_SHORT': 'Password too short',
      'errors.codes.USER_NOT_FOUND': 'User not found',
    });

    it('debe retornar error genérico cuando payload es undefined', () => {
      const result = translateApiError(undefined, mockT);
      expect(result).toBe('Generic error occurred');
    });

    it('debe usar clave de fallback personalizada', () => {
      const result = translateApiError(undefined, mockT, 'errors.codes.USER_NOT_FOUND');
      expect(result).toBe('User not found');
    });

    it('debe traducir error_code del payload', () => {
      const payload: ApiErrorPayload = {
        error_code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Wrong password',
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Invalid credentials');
    });

    it('debe usar campo code si error_code no existe', () => {
      const payload: ApiErrorPayload = {
        code: 'USERNAME_TAKEN',
        message: 'User exists',
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Username already taken');
    });

    it('debe extraer y usar error code del campo errors', () => {
      const payload: ApiErrorPayload = {
        errors: {
          field1: { code: 'PASSWORD_TOO_SHORT', message: 'Too short' },
        },
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Password too short');
    });

    it('debe usar mensaje de error de campo como fallback', () => {
      const payload: ApiErrorPayload = {
        errors: {
          field1: { message: 'Custom field error' },
        },
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Custom field error');
    });

    it('debe usar primer error de campo cuando múltiples errores existen', () => {
      const payload: ApiErrorPayload = {
        errors: {
          field1: 'Error 1',
          field2: 'Error 2',
        },
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Error 1');
    });

    it('debe usar mensaje del payload como fallback', () => {
      const payload: ApiErrorPayload = {
        message: 'Server message',
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Server message');
    });

    it('debe usar campo error del payload como fallback', () => {
      const payload: ApiErrorPayload = {
        error: 'Request failed',
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Request failed');
    });

    it('debe manejar objetos de error anidados', () => {
      const payload: ApiErrorPayload = {
        errors: {
          username: { code: 'USERNAME_TAKEN', message: 'Already exists' },
          password: { message: 'Too weak' },
        },
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Username already taken');
    });

    it('debe usar fallback a error genérico cuando no hay traducción', () => {
      const payload: ApiErrorPayload = {
        error_code: 'UNKNOWN_ERROR',
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Generic error occurred');
    });

    it('debe priorizar error_code sobre campo code', () => {
      const payload: ApiErrorPayload = {
        error_code: 'AUTH_INVALID_CREDENTIALS',
        code: 'USERNAME_TAKEN',
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Invalid credentials');
    });

    it('debe manejar objeto errors vacío', () => {
      const payload: ApiErrorPayload = {
        errors: {},
        message: 'Fallback message',
      };
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Fallback message');
    });

    it('debe usar error genérico como fallback absoluto', () => {
      const payload: ApiErrorPayload = {};
      const result = translateApiError(payload, mockT);
      expect(result).toBe('Generic error occurred');
    });
  });
});
