import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  normalizeLanguage,
  getLanguageStorageKey,
  getStoredLanguage,
  resolveInitialLanguage,
  setStoredLanguage,
  type AppLanguage,
} from '../i18n/storage';

describe('i18n/storage', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key]);
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeLanguage', () => {
    it('debe retornar es para valores nulos o undefined', () => {
      expect(normalizeLanguage(null)).toBe('es');
      expect(normalizeLanguage(undefined)).toBe('es');
      expect(normalizeLanguage('')).toBe('es');
    });

    it('debe retornar en para valores similares al inglés', () => {
      expect(normalizeLanguage('en')).toBe('en');
      expect(normalizeLanguage('EN')).toBe('en');
      expect(normalizeLanguage('en-US')).toBe('en');
      expect(normalizeLanguage('english')).toBe('en');
    });

    it('debe retornar pt para valores similares al portugués', () => {
      expect(normalizeLanguage('pt')).toBe('pt');
      expect(normalizeLanguage('PT')).toBe('pt');
      expect(normalizeLanguage('pt-BR')).toBe('pt');
      expect(normalizeLanguage('portuguese')).toBe('pt');
    });

    it('debe retornar fr para valores similares al francés', () => {
      expect(normalizeLanguage('fr')).toBe('fr');
      expect(normalizeLanguage('FR')).toBe('fr');
      expect(normalizeLanguage('fr-FR')).toBe('fr');
      expect(normalizeLanguage('french')).toBe('fr');
    });

    it('debe retornar de para valores similares al alemán', () => {
      expect(normalizeLanguage('de')).toBe('de');
      expect(normalizeLanguage('DE')).toBe('de');
      expect(normalizeLanguage('de-DE')).toBe('de');
      expect(normalizeLanguage('deutsch')).toBe('de');
    });

    it('debe retornar es para valores en español e desconocidos', () => {
      expect(normalizeLanguage('es')).toBe('es');
      expect(normalizeLanguage('ES')).toBe('es');
      expect(normalizeLanguage('es-ES')).toBe('es');
      expect(normalizeLanguage('unknown')).toBe('es');
      expect(normalizeLanguage('xyz')).toBe('es');
    });
  });

  describe('getLanguageStorageKey', () => {
    it('debe retornar clave global cuando no hay nombre de usuario', () => {
      expect(getLanguageStorageKey()).toBe('yovi_lang');
      expect(getLanguageStorageKey(undefined)).toBe('yovi_lang');
    });

    it('debe retornar clave específíca del usuario cuando se proporciona', () => {
      expect(getLanguageStorageKey('pepe')).toBe('yovi_lang_pepe');
      expect(getLanguageStorageKey('john_doe')).toBe('yovi_lang_john_doe');
    });
  });

  describe('getStoredLanguage', () => {
    it('debe retornar null cuando localStorage no está disponible', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
      });
      expect(getStoredLanguage()).toBeNull();
    });

    it('debe retornar idioma específico del usuario si está almacenado', () => {
      localStorage.setItem('yovi_lang_pepe', 'en');
      expect(getStoredLanguage('pepe')).toBe('en');
    });

    it('debe retornar idioma global si no hay idioma específíco del usuario', () => {
      localStorage.setItem('yovi_lang', 'fr');
      expect(getStoredLanguage('unknown_user')).toBe('fr');
    });

    it('debe retornar null cuando no hay idioma almacenado', () => {
      expect(getStoredLanguage('newuser')).toBeNull();
    });

    it('debe retornar null para consulta sin nombre de usuario y sin idioma global', () => {
      expect(getStoredLanguage()).toBeNull();
    });

    it('debe normalizar los valores de idioma almacenados', () => {
      localStorage.setItem('yovi_lang_pepe', 'EN-US');
      expect(getStoredLanguage('pepe')).toBe('en');
    });
  });

  describe('resolveInitialLanguage', () => {
    it('debe retornar idioma almacenado si está disponible', () => {
      localStorage.setItem('yovi_lang', 'fr');
      expect(resolveInitialLanguage()).toBe('fr');
    });

    it('debe retornar idioma del navegador normalizado', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'pt-BR',
        writable: true,
      });
      // Clear localStorage to force fallback to navigator
      localStorage.clear();
      expect(resolveInitialLanguage()).toBe('pt');
    });

    it('debe usar es por defecto cuando no hay idioma almacenado ni del navegador', () => {
      Object.defineProperty(navigator, 'language', {
        value: undefined,
        writable: true,
      });
      localStorage.clear();
      expect(resolveInitialLanguage()).toBe('es');
    });
  });

  describe('setStoredLanguage', () => {
    it('should set both user-specific and global language', () => {
      setStoredLanguage('en', 'pepe');
      expect(localStorage.getItem('yovi_lang_pepe')).toBe('en');
      expect(localStorage.getItem('yovi_lang')).toBe('en');
    });

    it('should set global language when no username', () => {
      setStoredLanguage('fr');
      expect(localStorage.getItem('yovi_lang')).toBe('fr');
    });

    it('should handle localStorage errors gracefully', () => {
      const errorStorage = {
        getItem: () => null,
        setItem: () => {
          throw new Error('Storage full');
        },
      };
      Object.defineProperty(globalThis, 'localStorage', {
        value: errorStorage,
        writable: true,
      });
      // Should not throw
      expect(() => setStoredLanguage('de', 'user')).not.toThrow();
    });

    it('should support all language codes', () => {
      const languages: AppLanguage[] = ['es', 'en', 'pt', 'fr', 'de'];
      languages.forEach(lang => {
        setStoredLanguage(lang);
        expect(localStorage.getItem('yovi_lang')).toBe(lang);
      });
    });
  });
});
