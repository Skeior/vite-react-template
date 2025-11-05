import React, { ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Timeline from "../Timeline/Timeline";
import "./About.css";
import { useLanguage } from "../../Components/LanguageProvider";
import SEO from "../../Components/SEO";
import FooterInfo from "../../Components/FooterInfo";
import { FaMicrochip, FaDraftingCompass, FaCogs, FaBatteryThreeQuarters, FaUsersCog } from "react-icons/fa";

interface HeroContent {
  name: string;
  title: string;
  availability: {
    status: string;
    detail: string;
  };
}

interface StatEntry {
  id: string;
  value: string;
  label: string;
  description: string;
}

interface SkillEntry {
  label: string;
  stars?: number;
  icon?: ReactNode;
}

interface PageContent {
  hero: HeroContent;
  stats: StatEntry[];
  about: string[];
  skills: SkillEntry[];
}
const AboutPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const content = useMemo<PageContent>(() => {
    if (lang === "tr") {
      return {
        hero: {
          name: "Talha Karasu",
          title: "Gömülü Sistemler Mühendisi",
          availability: {
            status: "Gömülü mühendis rollerine / stajlara açığım",
            detail: "Ar-Ge ve ürün geliştirme projelerinde yer alabilirim."
          }
        },
        stats: [
          {
            id: "experience",
            value: "3+",
            label: "Yıl gömülü sistem deneyimi",
            description: "STM32 tabanlı motor sürücülerden telemetri sistemlerine."
          },
        ],
        skills: [
          { label: "Gömülü sistem geliştirme (STM32, C/C++)", stars: 4, icon: <FaMicrochip /> },
          { label: "PCB tasarımı & elektronik entegrasyon (Altium Designer)", stars: 4, icon: <FaDraftingCompass /> },
          { label: "BLDC motor kontrolü & sürücü tasarımı (PWM, FOC, SixStep)", stars: 4, icon: <FaCogs /> },
          { label: "Batarya Yönetim Sistemleri & enerji optimizasyonu", stars: 3, icon: <FaBatteryThreeQuarters /> },
        ],
        about: [
          "Bilgisayar Mühendisliği son sınıf öğrencisiyim ve donanım ile gömülü yazılım alanlarını entegre ederek bütünleşik Ar‑Ge çözümleri geliştirmeye odaklanıyorum. Motor kontrolü ve güç elektroniği konularında yazılım geliştirme ve PCB tasarımı üzerine çalışıyor, projelerimi prototipten üretim aşamasına kadar titizlikle yönetiyorum. Analitik düşünme becerim, detaylara verdiğim önem ve mükemmeliyetçi yaklaşımım sayesinde karmaşık sistemlerde verimli ve güvenilir sonuçlar elde etmeye odaklanıyorum. VoltaTEAM ekibiyle birlikte elektrikli araç teknolojilerinin tasarım ve geliştirme süreçlerinde aktif rol alarak takım çalışması, liderlik ve proje yönetimi konularında güçlü deneyimler kazandım."
        ],
      };
    }

    return {
      hero: {
        name: "Talha Karasu",
        title: "Embedded Systems Engineer",
        availability: {
          status: "Open to embedded engineer roles / internships",
          detail: "Available for R&D collaborations and product engineering engagements."
        }
      },
      stats: [
        {
          id: "experience",
          value: "3+",
          label: "Years in embedded systems",
          description: "From STM32 motor drivers to telemetry gateways."
        },
      ],
      skills: [
        { label: "Embedded systems development (STM32, C/C++)", stars: 4, icon: <FaMicrochip /> },
        { label: "PCB design & electronics integration (Altium Designer)", stars: 4, icon: <FaDraftingCompass /> },
        { label: "BLDC motor control & driver design (PWM, FOC, SixStep)", stars: 4, icon: <FaCogs /> },
        { label: "Battery Management Systems & energy optimization", stars: 3, icon: <FaBatteryThreeQuarters /> },
        { label: "Leadership in R&D projects (electric & hydrogen vehicles)", stars: 4, icon: <FaUsersCog /> }
        ],
      about: [
        "I'm a final-year Computer Engineering student focused on delivering integrated R&D solutions by combining hardware and embedded software. I work on firmware development and PCB design for motor control and power electronics, managing projects meticulously from prototype to production. With strong analytical thinking, attention to detail, and a perfectionist approach, I aim to deliver efficient and reliable results in complex systems. Working with VoltaTEAM, I played an active role in designing and developing electric vehicle technologies, gaining solid experience in teamwork, leadership, and project management."
      ],
    };
  }, [lang]);

  // Prefer i18n `about.paragraphs` when available to avoid duplicating text
  // in both translation files and the component state.
  const i18nAbout = (t && (t("about.paragraphs") as any)) || null;

  const handleLocalScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Provide About text to SEO for crawlers: use i18n paragraphs if present, otherwise fallback */}
      {(() => {
        const aboutArr = (i18nAbout ?? content.about) as string[];
        const aboutText = Array.isArray(aboutArr) ? aboutArr.join(' ') : String(aboutArr);
        const structuredData = {
          '@type': 'AboutPage',
          'mainEntity': {
            '@type': 'Person',
            'name': content.hero.name,
            'description': aboutText,
            'url': 'https://talhakarasu.com'
          }
        };

        return (
          <SEO
            title={content.hero.name}
            description={aboutText || content.hero.title}
            image={'https://talhakarasu.com/images/og-image.svg'}
            structuredData={structuredData}
          />
        );
      })()}
      <main className="home" id="top">
        <section id="hero" className="hero" data-nav-section>
          <motion.div className="hero-content" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="eyebrow">{content.hero.name}</p>
            <h1>{content.hero.title}</h1>

            <div className="hero-ctas">
              <a
                className="button"
                href={lang === "tr" ? "/res-tr.pdf" : "/res.pdf"}
                download={lang === "tr" ? "TalhaKarasu-CV-TR.pdf" : "TalhaKarasu-CV-EN.pdf"}
              >
                {t ? t("about.downloadCV") : lang === "tr" ? "CV İndir" : "Download CV"}
              </a>
              <button className="outline-button" onClick={() => navigate("/portfolio")}>
                View Projects
              </button>
            </div>

            <div className="availability-banner">
              <span className="availability-status">{content.hero.availability.status}</span>
              <span className="availability-detail">{content.hero.availability.detail}</span>
            </div>
          </motion.div>

          <aside className="hero-stats" aria-label="Quick stats">
            <h2>{lang === "tr" ? "Hızlı istatistikler" : "Quick stats"}</h2>

            {/* Skills pulled into the hero area */}
            <div className="skills-card" role="list">
              {content.skills.map((s, i) => {
                const hasStars = typeof s.stars === "number";
                const starCount = hasStars ? s.stars : undefined;
                const starLabel = hasStars ? (lang === "tr" ? `5 üzerinden ${starCount}` : `${starCount} out of 5`) : undefined;

                return (
                  <div
                    key={i}
                    className="skill-row"
                    role="listitem"
                    title={starLabel ? `${s.label} · ${starLabel}` : s.label}
                  >
                    <span className="skill-icon" aria-hidden>
                      {s.icon ?? "•"}
                    </span>
                    <span className="skill-label">{s.label}</span>
                    {hasStars && starCount !== undefined && (
                      <>
                        <span className="visually-hidden">
                          {lang === "tr" ? `${s.label} becerisi 5 üzerinden ${starCount}` : `${s.label} skill level ${starCount} out of 5`}
                        </span>
                        <div className="skill-stars" aria-hidden>
                          {Array.from({ length: 5 }, (_, starIndex) => (
                            <span
                              key={starIndex}
                              className={starIndex < starCount ? "skill-star skill-star--filled" : "skill-star"}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="stats-grid">
              {content.stats.map((stat) => (
                <div key={stat.id} className="stat-card">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                  <p>{stat.description}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section id="about" className="section about-section" data-nav-section>
          <div className="section-heading">
            <p className="eyebrow">{lang === "tr" ? "Hakkımda" : "About"}</p>
            <h2>{lang === "tr" ? "Uzmanlık Alanlarım" : "Areas of expertise"}</h2>
          </div>
          <div className="about-columns">
            {(i18nAbout ?? content.about).map((paragraph: any, index: number) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>

       

        <section id="timeline" className="section timeline-section" data-nav-section>
          <div className="section-heading">
            <p className="eyebrow">{lang === "tr" ? "Zaman çizelgesi" : "Timeline"}</p>
            <h2>{lang === "tr" ? "Ekip içi sorumluluklar" : "Key milestones"}</h2>
          </div>
          <div className="timeline-card">
            <Timeline />
          </div>
        </section>

        <FooterInfo onQuickLink={handleLocalScroll} />

      </main>
    </>
  );
};

export default AboutPage;
