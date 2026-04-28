import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resolveInitialLanguage } from './storage';
import { resources } from './resources';

// Inicializa i18next con React
i18n.use(initReactI18next).init({
  resources,
  lng: resolveInitialLanguage(),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
