import { useTranslation } from 'react-i18next';
import { normalizeLanguage, setStoredLanguage, type AppLanguage } from '../i18n/storage';

type LanguageSelectorProps = {
  username?: string;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  showLabel?: boolean;
};

// Componente para seleccionar el idioma de la aplicación
const LanguageSelector = ({
  username,
  containerClassName,
  labelClassName,
  selectClassName,
  showLabel = false,
}: LanguageSelectorProps) => {
  const { t, i18n } = useTranslation();

  const currentLanguage: AppLanguage = normalizeLanguage(i18n.language);

  const onChangeLanguage = async (language: AppLanguage) => {
    setStoredLanguage(language, username);
    await i18n.changeLanguage(language);
  };

  return (
    <label className={containerClassName ?? 'language-selector'} title={t('language.changeHint')}>
      {showLabel && <span className={labelClassName ?? 'language-selector-label'}>{t('language.label')}:</span>}
      <select
        aria-label={t('language.label')}
        className={selectClassName ?? 'language-selector-select'}
        value={currentLanguage}
        onChange={(event) => onChangeLanguage(event.target.value as AppLanguage)}
      >
        <option value="es">ES | {t('language.spanish')}</option>
        <option value="en">EN | {t('language.english')}</option>
        <option value="pt">PT | {t('language.portuguese')}</option>
        <option value="fr">FR | {t('language.french')}</option>
        <option value="de">DE | {t('language.german')}</option>
      </select>
    </label>
  );
};

export default LanguageSelector;
