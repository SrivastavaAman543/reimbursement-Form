import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import staticTranslations from '../i18n/translations.json';

const TranslationContext = createContext({});

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const [lang, setLang] = useState('en');
  const [dynamicOverrides, setDynamicOverrides] = useState({});

  useEffect(() => {
    if (lang === 'en') return;

    // Extract all underlying English strings from the base dictionary
    const englishTexts = [];
    Object.values(staticTranslations['en']).forEach(val => {
        if (typeof val === 'string') englishTexts.push(val);
        else if (typeof val === 'object') {
            Object.values(val).forEach(subVal => {
                if (typeof subVal === 'string') englishTexts.push(subVal);
            });
        }
    });

    const fetchTranslations = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await axios.post("http://localhost:8000/api/translate", {
          texts: englishTexts,
          target_language: lang
        }, {
           headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.data && res.data.translations) {
            setDynamicOverrides(res.data.translations);
        }
      } catch (error) {
        console.error("Translation API failed:", error);
      }
    };

    fetchTranslations();
  }, [lang]);

  // Build the `t` object seamlessly
  const baseT = staticTranslations['en'];
  let t;

  if (lang === 'en') {
      t = baseT;
  } else {
      const fallbackT = staticTranslations[lang] || baseT;
      t = { ...baseT };
      
      Object.keys(baseT).forEach(key => {
        if (typeof baseT[key] === 'string') {
            const enString = baseT[key];
            const hasManual = fallbackT[key] && fallbackT[key] !== enString;
            t[key] = hasManual ? fallbackT[key] : (dynamicOverrides[enString] || fallbackT[key] || enString);
        } else if (typeof baseT[key] === 'object') {
            t[key] = { ...baseT[key] };
            Object.keys(baseT[key]).forEach(subKey => {
                const enSubString = baseT[key][subKey];
                const hasManual = fallbackT[key]?.[subKey] && fallbackT[key][subKey] !== enSubString;
                t[key][subKey] = hasManual ? fallbackT[key][subKey] : (dynamicOverrides[enSubString] || fallbackT[key]?.[subKey] || enSubString);
            });
        }
      });
  }

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
};
