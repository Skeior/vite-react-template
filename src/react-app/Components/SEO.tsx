import { Helmet } from "react-helmet-async";
import { useLanguage } from "./LanguageProvider";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, keywords }) => {
  const { lang } = useLanguage();
  
  const defaultTitle = lang === "tr" ? "Talha Karasu - Gömülü Sistemler" : "Talha Karasu - Embedded Systems";
  const defaultDescription = lang === "tr" 
    ? "Gömülü sistemler, PCB tasarımı ve motor kontrolü konusunda deneyimli Bilgisayar Mühendisliği öğrencisi."
    : "Computer Engineering student experienced in embedded systems, PCB design, and motor control.";
  const defaultKeywords = lang === "tr"
    ? "gömülü sistemler, STM32, PCB tasarımı, BLDC motor, FOC, Altium Designer, Talha Karasu"
    : "embedded systems, STM32, PCB design, BLDC motor, FOC, Altium Designer, Talha Karasu";

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title ? `${title} | ${defaultTitle}` : defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="author" content="Talha Karasu" />
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
    </Helmet>
  );
};

export default SEO;
