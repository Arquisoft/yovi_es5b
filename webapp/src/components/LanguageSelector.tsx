import { useTranslation } from 'react-i18next';
import { setStoredLanguage, type AppLanguage } from '../i18n/storage';

type LanguageSelectorProps = {
  username?: string;
};

// Componente para seleccionar el idioma de la aplicación
const LanguageSelector = ({ username }: LanguageSelectorProps) => {
  const { t, i18n } = useTranslation();

  const currentLanguage: AppLanguage = i18n.language.toLowerCase().startsWith('en') ? 'en' : 'es';

  const onChangeLanguage = async (language: AppLanguage) => {
    setStoredLanguage(language, username);
    await i18n.changeLanguage(language);
  };

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{t('language.label')}:</span>
      <select
        aria-label={t('language.label')}
        value={currentLanguage}
        onChange={(event) => onChangeLanguage(event.target.value as AppLanguage)}
      >
        <option value="es">{t('language.spanish')}</option>
        <option value="en">{t('language.english')}</option>
      </select>
    </label>
  );
};

export default LanguageSelector;
