// Funciones para manejar el almacenamiento de la preferencia de idioma del usuario
export type AppLanguage = 'es' | 'en' | 'pt' | 'fr' | 'de';

const GLOBAL_LANGUAGE_KEY = 'yovi_lang';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const getSafeStorage = (): StorageLike | null => {
  const candidate = (globalThis as { localStorage?: unknown }).localStorage;
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const getItem = (candidate as { getItem?: unknown }).getItem;
  const setItem = (candidate as { setItem?: unknown }).setItem;
  if (typeof getItem !== 'function' || typeof setItem !== 'function') {
    return null;
  }

  return candidate as StorageLike;
};

const getNavigatorLanguage = (): string | undefined => {
  return (globalThis as { navigator?: { language?: string } }).navigator?.language;
};

export const normalizeLanguage = (value?: string | null): AppLanguage => {
  if (!value) {
    return 'es';
  }

  const normalizedValue = value.toLowerCase();

  // Comprobar códigos de idioma del locale
  if (normalizedValue.startsWith('en') || normalizedValue === 'english') return 'en';
  if (normalizedValue.startsWith('pt') || normalizedValue === 'portuguese') return 'pt';
  if (normalizedValue.startsWith('fr') || normalizedValue === 'french') return 'fr';
  if (normalizedValue.startsWith('de') || normalizedValue === 'deutsch') return 'de';
  if (normalizedValue.startsWith('es') || normalizedValue === 'spanish') return 'es';
  return 'es';
};

export const getLanguageStorageKey = (username?: string): string => {
  if (!username) {
    return GLOBAL_LANGUAGE_KEY;
  }

  return `${GLOBAL_LANGUAGE_KEY}_${username}`;
};

export const getStoredLanguage = (username?: string): AppLanguage | null => {
  const storage = getSafeStorage();
  if (!storage) {
    return null;
  }

  const fromUser = storage.getItem(getLanguageStorageKey(username));
  if (fromUser) {
    return normalizeLanguage(fromUser);
  }

  if (!username) {
    return null;
  }

  const globalFallback = storage.getItem(GLOBAL_LANGUAGE_KEY);
  return globalFallback ? normalizeLanguage(globalFallback) : null;
};

export const resolveInitialLanguage = (): AppLanguage => {
  const stored = getStoredLanguage();
  if (stored) {
    return stored;
  }

  return normalizeLanguage(getNavigatorLanguage());
};

export const setStoredLanguage = (language: AppLanguage, username?: string): void => {
  const storage = getSafeStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(getLanguageStorageKey(username), language);
    storage.setItem(GLOBAL_LANGUAGE_KEY, language);
  } catch {
    // Ignora errores de persistencia que ocurren al usar modo incógnito o configuraciones muy específicas
  }
};
