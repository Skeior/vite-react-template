import React from "react";
import { useLanguage } from "./LanguageProvider";

const LanguageToggle: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-toggle">
      <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>EN</button>
      <button className={`lang-btn ${lang === "tr" ? "active" : ""}`} onClick={() => setLang("tr")}>TR</button>
    </div>
  );
};

export default LanguageToggle;
