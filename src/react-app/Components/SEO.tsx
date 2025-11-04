import { Helmet } from "react-helmet-async";
import { useLanguage } from "./LanguageProvider";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string; // absolute URL preferred
  url?: string; // canonical URL for the page
  structuredData?: any | null; // optional page-specific JSON-LD
}

export const SEO: React.FC<SEOProps> = ({ title, description, keywords, image, url, structuredData }) => {
  const { lang } = useLanguage();

  const defaultTitle = lang === "tr" ? "Talha Karasu - Gömülü Sistemler" : "Talha Karasu - Embedded Systems";
  const defaultDescription = lang === "tr"
    ? "Gömülü sistemler, PCB tasarımı ve motor kontrolü konusunda deneyimli Bilgisayar Mühendisliği öğrencisi."
    : "Computer Engineering student experienced in embedded systems, PCB design, and motor control.";
  const defaultKeywords = lang === "tr"
    ? "gömülü sistemler, STM32, PCB tasarımı, BLDC motor, FOC, Altium Designer, Talha Karasu"
    : "embedded systems, STM32, PCB design, BLDC motor, FOC, Altium Designer, Talha Karasu";

  const pageTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageKeywords = keywords || defaultKeywords;

  // attempt to compute canonical if not provided (only in browser)
  let canonical: string | undefined = url;
  if (!canonical && typeof window !== "undefined") {
    try { canonical = window.location.href.split('#')[0]; } catch (e) { /* ignore */ }
  }

  // Basic JSON-LD site and organization schema + optional page-specific structuredData
  const siteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': defaultTitle,
    'url': canonical || 'https://talhakarasu.com',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${canonical || 'https://talhakarasu.com'}/?s={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const personOrOrg = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': 'Talha Karasu',
    'url': canonical || 'https://talhakarasu.com'
  };

  // Compose full structured data: site + person + optional page-level object
  const jsonLd = [siteSchema, personOrOrg];
  if (structuredData) jsonLd.push(structuredData as any);

  // hreflang alternatives (assuming en/tr site structure). Adjust if your routing differs.
  const alternateEn = (canonical || '').replace(/\/tr\//, '/en/');
  const alternateTr = (canonical || '').replace(/\/en\//, '/tr/');

  return (
    <Helmet>
      <html lang={lang} />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content="Talha Karasu" />

      {/* Open Graph / Twitter */}
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
    {/* og:image: prefer explicit image prop, fallback to site default */}
    <meta property="og:image" content={image || 'https://talhakarasu.com/images/og-image.svg'} />
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta name="twitter:description" content={pageDescription} />
    <meta name="twitter:image" content={image || 'https://talhakarasu.com/images/og-image.svg'} />

      {/* canonical and hreflang */}
      {canonical && <link rel="canonical" href={canonical} />}
      {canonical && <link rel="alternate" hrefLang="en" href={alternateEn || canonical} />}
      {canonical && <link rel="alternate" hrefLang="tr" href={alternateTr || canonical} />}

      {/* JSON-LD structured data */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default SEO;
