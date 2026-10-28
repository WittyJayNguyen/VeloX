import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import vi from '../locales/vi/common.json';
import en from '../locales/en/common.json';
import ja from '../locales/ja/common.json';
import ko from '../locales/ko/common.json';
import zh from '../locales/zh/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
      ja: { translation: ja },
      ko: { translation: ko },
      zh: { translation: zh },
    },
    supportedLngs: ['vi', 'en', 'ja', 'ko', 'zh'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'vi',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'velox_lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

// Keep document.documentElement.lang in sync with i18n
i18n.on('languageChanged', (lng) => {
  const clean = (lng || 'vi').split('-')[0];
  document.documentElement.lang = clean;
});

export default i18n;
