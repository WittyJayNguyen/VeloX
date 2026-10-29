import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import vi from '../locales/vi/common.json';
import en from '../locales/en/common.json';
import ja from '../locales/ja/common.json';
import ko from '../locales/ko/common.json';
import zh from '../locales/zh/common.json';

// Cố định ngôn ngữ toàn hệ thống là Tiếng Việt (vi)
if (typeof window !== 'undefined') {
  localStorage.setItem('velox_lang', 'vi');
  localStorage.setItem('i18nextLng', 'vi');
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
      ja: { translation: ja },
      ko: { translation: ko },
      zh: { translation: zh },
    },
    lng: 'vi',
    fallbackLng: 'vi',
    supportedLngs: ['vi', 'en', 'ja', 'ko', 'zh'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
  });

if (typeof document !== 'undefined') {
  document.documentElement.lang = 'vi';
}

export default i18n;
