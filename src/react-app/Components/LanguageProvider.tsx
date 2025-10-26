import { createContext, useContext, useState, ReactNode } from "react";
import en from "../i18n/en.json";
import tr from "../i18n/tr.json";

type Lang = "en" | "tr";

const translations: Record<Lang, any> = {
  en,
  tr
};

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  // t() can return string or nested objects/arrays from the translations
  t: (key: string) => any;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("en");

  const t = (key: string) => {
    const parts = key.split(".");
    let current: any = translations[lang];
    for (const p of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[p];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export default LanguageProvider;
