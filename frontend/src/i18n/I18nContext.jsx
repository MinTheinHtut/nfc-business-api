import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getInitialLanguage, LANGUAGE_KEY, supportedLanguages, translate } from './core.js';
export { getInitialLanguage, LANGUAGE_KEY, supportedLanguages, translate } from './core.js';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);
  const setLanguage = (next) => setLanguageState(supportedLanguages.includes(next) ? next : 'en');

  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Storage may be unavailable. */ }
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t: (key, values) => translate(language, key, values) }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}

export function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage, t } = useI18n();
  return <label className={`language-switcher ${className}`.trim()}>
    <span>{t('common.language')}</span>
    <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t('common.language')}>
      <option value="en">English</option><option value="th">ไทย</option><option value="ja">日本語</option>
    </select>
  </label>;
}
