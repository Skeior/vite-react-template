import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "./LanguageProvider";
import "./FooterInfo.css";

interface ContactItem {
  label: string;
  value: string;
  href?: string;
}

interface QuickLink {
  label: string;
  target: string;
}

interface ExternalLink {
  label: string;
  href: string;
}

interface FooterInfoContent {
  eyebrow: string;
  title: string;
  description: string;
  contact: ContactItem[];
  quickLinks: QuickLink[];
  externalLinks: ExternalLink[];
  footerNote: string;
}

interface FooterInfoProps {
  onQuickLink?: (target: string) => void;
}

const FooterInfo: React.FC<FooterInfoProps> = ({ onQuickLink }) => {
  const { lang } = useLanguage();
  const currentYear = new Date().getFullYear();

  const content = useMemo<FooterInfoContent>(() => {
    if (lang === "tr") {
      return {
        eyebrow: "İletişim",
        title: "Güvenilir elektronik sistemler üretelim",
        description: "Kayseri, Türkiye merkezliyim. Gömülü mühendislik projeleri ve iş birliklerine açığım.",
        contact: [
          { label: "Konum", value: "Kayseri, Türkiye" },
          { label: "E-posta", value: "talhakarasu2@gmail.com", href: "mailto:talhakarasu2@gmail.com" },
          { label: "Web", value: "talhakarasu.com", href: "https://talhakarasu.com" }
        ],
        quickLinks: [
          { label: "Projeler", target: "projects" },
          { label: "Zaman çizelgesi", target: "timeline" },
          { label: "Güncellemeler", target: "updates" },
          { label: "Kaynaklar", target: "cv" }
        ],
        externalLinks: [
          { label: "GitHub", href: "https://github.com/skeior" },
          { label: "LinkedIn", href: "https://linkedin.com/in/talha-karasu" }
        ],
        footerNote: "Tüm hakları saklıdır."
      };
    }

    return {
      eyebrow: "Stay connected",
      title: "Let's build reliable electronics together",
      description: "Based in Kayseri, Türkiye. Open to embedded engineering collaborations and roles.",
      contact: [
        { label: "Location", value: "Kayseri, Türkiye" },
        { label: "Email", value: "talhakarasu2@gmail.com", href: "mailto:talhakarasu2@gmail.com" },
        { label: "Website", value: "talhakarasu.com", href: "https://talhakarasu.com" }
      ],
      quickLinks: [
        { label: "Projects", target: "projects" },
        { label: "Timeline", target: "timeline" },
        { label: "Updates", target: "updates" },
        { label: "Resources", target: "cv" }
      ],
      externalLinks: [
        { label: "GitHub", href: "https://github.com/skeior" },
        { label: "LinkedIn", href: "https://linkedin.com/in/talha-karasu" }
      ],
      footerNote: "All rights reserved."
    };
  }, [lang]);

  return (
    <section className="footer-info-section" aria-labelledby="footer-info-heading">
      <div className="info-heading">
        <p className="eyebrow">{content.eyebrow}</p>
        <h2 id="footer-info-heading">{content.title}</h2>
        <p>{content.description}</p>
      </div>

      <div className="footer-info-grid">
        <article className="info-card">
          <h3>{lang === "tr" ? "İletişim" : "Contact"}</h3>
          <ul className="info-list">
            {content.contact.map((item) => (
              <li key={item.label}>
                <span className="info-label">{item.label}</span>
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {item.value}
                  </a>
                ) : (
                  <span>{item.value}</span>
                )}
              </li>
            ))}
          </ul>
        </article>

        <article className="info-card">
          <h3>{lang === "tr" ? "Site içinde" : "On this site"}</h3>
          <div className="info-links">
            {content.quickLinks.map((link) =>
              onQuickLink ? (
                <button
                  key={link.target}
                  type="button"
                  className="link-button"
                  onClick={() => onQuickLink(link.target)}
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.target}
                  className="link-button"
                  to={{ pathname: "/", hash: `#${link.target}` }}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </article>

        <article className="info-card">
          <h3>{lang === "tr" ? "Dış bağlantılar" : "External"}</h3>
          <div className="info-links">
            {content.externalLinks.map((link) => (
              <a key={link.href} className="link-button" href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </article>
      </div>

      <p className="info-meta">© {currentYear} Talha Karasu · {content.footerNote}</p>
    </section>
  );
};

export default FooterInfo;
