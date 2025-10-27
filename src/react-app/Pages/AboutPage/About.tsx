import React, { ReactNode, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Timeline from "../Timeline/Timeline";
import "./About.css";
import { useLanguage } from "../../Components/LanguageProvider";
import SEO from "../../Components/SEO";
import FooterInfo from "../../Components/FooterInfo";
import { FaMicrochip, FaDraftingCompass, FaCogs, FaBatteryThreeQuarters, FaUsersCog } from "react-icons/fa";

interface ProjectMetric {
  label: string;
  value: string;
}

interface ProjectCaseStudy {
  overview: string;
  architecture: string[];
  challenges: string[];
  lessons: string[];
  future: string[];
}

interface ProjectEntry {
  slug: string;
  title: string;
  status: "delivered" | "ongoing";
  problem: string;
  approach: string[];
  result: string;
  metrics: ProjectMetric[];
  caseStudy?: ProjectCaseStudy;
}

interface HeroContent {
  name: string;
  title: string;
  valueProp: string;
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

interface UpdateEntry {
  id: string;
  date: string;
  title: string;
  summary: string;
}

interface PageContent {
  hero: HeroContent;
  stats: StatEntry[];
  about: string[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
  updates: UpdateEntry[];
}

const CaseStudyModal: React.FC<{ project: ProjectEntry; onClose: () => void }> = ({ project, onClose }) => (
  <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
    <motion.article
      className="modal-panel"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      onClick={(event) => event.stopPropagation()}
    >
      <header className="modal-header">
        <div>
          <p className="modal-kicker">{project.status === "delivered" ? "Delivered" : "Ongoing"}</p>
          <h2>{project.title}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close case study">
          ×
        </button>
      </header>

      {project.caseStudy && (
        <div className="modal-body">
          <section>
            <h3>Overview</h3>
            <p>{project.caseStudy.overview}</p>
          </section>
          <section>
            <h3>Architecture</h3>
            <ul>
              {project.caseStudy.architecture.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Lessons learned</h3>
            <ul>
              {project.caseStudy.lessons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Next steps</h3>
            <ul>
              {project.caseStudy.future.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </motion.article>
  </motion.div>
);

const AboutPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [activeCaseStudy, setActiveCaseStudy] = useState<ProjectEntry | null>(null);

  const content = useMemo<PageContent>(() => {
    if (lang === "tr") {
      return {
        hero: {
          name: "Talha Karasu",
          title: "Gömülü Sistemler Mühendisi",
          valueProp: "BLDC sürücülerden telemetri istasyonlarına kadar yüksek güvenilirlikte gömülü sistemler geliştiriyorum.",
          availability: {
            status: "Gömülü mühendis rollerine / stajlara açığım",
            detail: "Ar-Ge ve ürün geliştirme projelerinde yer almak için müsaitim."
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
          { label: "Ar-Ge projelerinde liderlik (elektrikli & hidrojen araçlar)", stars: 4, icon: <FaUsersCog /> }
        ],
        about: [
          "Motor kontrolü, telemetri ve dayanıklı elektronik üzerine çalışan gömülü yazılım & donanım geliştiricisi.",
          "STM32 tabanlı prototipleri üretim seviyesine taşıyan son sınıf Bilgisayar Mühendisliği öğrencisiyim; BLDC sürücüler ve telemetri istasyonları geliştiriyorum.",
          "VoltaTEAM için C/C++ kontrol yazılımlarını PCB tasarımıyla birleştirerek verimli, servis edilebilir sistemler teslim ediyorum."
        ],
        projects: [
          {
            slug: "bldc",
            title: "BLDC Motor Sürücü (TÜBİTAK 2209-A)",
            status: "delivered" as const,
            problem: "Takımın Teknofest Efficiency Challenge testlerinden geçecek yerli, yüksek verimli ve 10 kW güç seviyesini destekleyen bir sürücüye ihtiyacı vardı.",
            approach: [
              "12-85 V giriş ve 0-80 V / 165 A çıkış aralığını kapsayan 10x10 cm, altı katmanlı PCB tasarlandı.",
              "STM32G4 platformunda FOC ve six-step algoritmaları PID akım kontrolü, faz-faz gerilim/akım ölçümü ve Hall/enkoder desteği ile entegre edildi.",
              "Aşırı akım, sıcaklık ve gerilim korumaları ile RS232 tabanlı teşhis kanalı jüri testleri için hazırlanan doğrulama sürecine eklendi."
            ],
            result: "Kart, Teknofest Efficiency Challenge 2025 jüri testlerinden geçti ve TÜBİTAK 2209-A kapsamında yerli ürün olarak raporlandı.",
            metrics: [
              { label: "Giriş gerilimi", value: "12-85 V" },
              { label: "Çıkış kapasitesi", value: "0-80 V / 165 A" },
              { label: "PCB", value: "10x10 cm · 6 katman" }
            ],
            caseStudy: {
              overview: "Elektrikli aracın güç ünitesini yerli hale getirmek için geliştirilen saha doğrulamadan geçmiş BLDC sürücü.",
              architecture: [
                "Güç ve kontrol katmanları ayrılmış altı katmanlı PCB",
                "STM32G4 tabanlı FOC/PID kontrol katmanı",
                "Faz akım ve gerilim ölçümleri, Hall & enkoder girişleri",
                "RS232 teşhis ve kalibrasyon arayüzü"
              ],
              challenges: [
                "165 A aralığında hassas akım ölçümü",
                "Teknofest güvenlik kriterlerine uygun koruma katmanları",
                "Yerel üretim dokümantasyon sürecinin tamamlanması"
              ],
              lessons: [
                "Donanım-yazılım birlikte test edilince iterasyon hızlandı",
                "Koruma katmanları kuruluma güven verdi",
                "Üretim dosyalarının erken hazırlanması onay sürecini kolaylaştırdı"
              ],
              future: [
                "RS232 yanında CAN haberleşme eklemek",
                "Takım üyeleri için hazır kalibrasyon araçları yayınlamak"
              ]
            }
          },
          {
            slug: "ground-station",
            title: "LoRa Yer İstasyonu ve Telemetri Portalı",
            status: "delivered" as const,
            problem: "Araç pistteyken güç elektroniği verilerine gerçek zamanlı erişim sağlayacak dayanıklı bir telemetri bağlantısı yoktu.",
            approach: [
              "Kontrol kartlarından gelen verileri toplayan LoRa tabanlı bir ağ geçidi geliştirildi.",
              "Windows üzerinde çalışan ve mühendislerin canlı uyarı almasını sağlayan masaüstü arayüz tasarlandı.",
              "Garajda kablolu kullanım için seri bağlantı yedek modu eklendi."
            ],
            result: "Takım pist testlerinde ve yarış haftasında önemli parametrelere kesintisiz erişim sağladı.",
            metrics: [
              { label: "LoRa menzili", value: "8 km'ye kadar" },
              { label: "Veri aktarım yolu", value: "LoRa + RS232 yedek" },
              { label: "Takip edilen parametre", value: "Güç elektroniği ve batarya telemetrisi" }
            ],
            caseStudy: {
              overview: "Elektrikli aracın pist üzerindeki durumunu izlemek için geliştirilen uçtan uca telemetri sistemi.",
              architecture: [
                "Araç içi STM32 düğümlerden LoRa ağ geçidine veri aktarımı",
                "Yedek olarak seri bağlantı üzerinden garaj içi güncelleme",
                "Masaüstü arayüzde canlı grafikler ve durum göstergeleri",
                "Otomatik veri kaydı ve günlükleme"
              ],
              challenges: [
                "Uzun mesafede sinyal tutarlılığı",
                "Hızlı kurulup kaldırılabilir pit ekipmanı",
                "Ara yüzün dış mekânda okunabilir olması"
              ],
              lessons: [
                "LoRa parametrelerini pist koşullarına göre ayarlamak kritik",
                "Saha testleri veri kaybı senaryolarını belirlemeyi sağladı",
                "Basit uyarılar pit ekibinin reaksiyon hızını arttırdı"
              ],
              future: [
                "Enerji tüketimi tahmini için veri analitiği katmanı",
                "Takım içi bilgilendirme için web tabanlı panel"
              ]
            }
          }
        ],
        updates: [
          {
            id: "esp-relay",
            date: "2025-09",
            title: "ESP tabanlı Wi-Fi röle modülü",
            summary: "ESP kartı ile 220V AC hattını güvenli şekilde anahtarlayan uzaktan erişimli röle prototipini tamamladım."
          }
        ] as UpdateEntry[]
      };
    }

    return {
      hero: {
        name: "Talha Karasu",
        title: "Embedded Systems Engineer",
        valueProp: "I build reliable embedded platforms ranging from BLDC drivers to LoRa telemetry stacks.",
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
        "Embedded firmware & hardware developer focused on motor control, telemetry, and rugged electronics.",
        "Final-year Computer Engineering student translating STM32 prototyping into production-ready BLDC drivers and telemetry stacks.",
        "Deliver high-reliability boards and firmware for VoltaTEAM, blending C/C++ control loops with PCB design to ship efficient, serviceable systems."
      ],
      projects: [
        {
          slug: "bldc",
          title: "BLDC Motor Driver (TÜBİTAK 2209-A)",
          status: "delivered" as const,
          problem: "The team needed a locally designed, high-efficiency driver capable of handling 10 kW-class power for Teknofest jury testing.",
          approach: [
            "Co-developed a 10x10 cm, six-layer PCB covering a 12-85 V input and 0-80 V / 165 A output envelope together with Emre Ceylan.",
            "Implemented FOC and six-step control on STM32G4 with PID current loops, phase voltage/current sensing, and Hall/encoder feedback.",
            "Built layered protection (over-current, temperature, voltage) plus an RS232 diagnostics channel to support jury validation."
          ],
          result: "The board passed Teknofest Efficiency Challenge 2025 jury evaluation and was logged as a locally developed product within the TÜBİTAK 2209-A grant.",
          metrics: [
            { label: "Input range", value: "12-85 V" },
            { label: "Output envelope", value: "0-80 V / 165 A" },
            { label: "PCB format", value: "10x10 cm · six layers" }
          ],
          caseStudy: {
            overview: "Race-proven BLDC driver developed to localise the vehicle powertrain.",
            architecture: [
              "Six-layer PCB separating power and logic domains",
              "STM32G4 control loop running FOC/PID",
              "Phase current & voltage sensing with Hall and encoder inputs",
              "RS232 diagnostics and calibration port"
            ],
            challenges: [
              "Maintaining current sensing accuracy at 165 A",
              "Meeting Teknofest protection and documentation requirements",
              "Coordinating hardware and firmware iterations under grant milestones"
            ],
            lessons: [
              "Joint hardware/firmware validation accelerated iterations",
              "Comprehensive protection logic eased jury testing",
              "Preparing manufacturing files early smoothed localisation audits"
            ],
            future: [
              "Add CAN alongside RS232 diagnostics",
              "Package calibration tooling for wider team onboarding"
            ]
          }
        },
        {
          slug: "ground-station",
          title: "LoRa Ground Station & Telemetry Portal",
          status: "delivered" as const,
          problem: "Pit engineers lacked a dependable data link to monitor power electronics while the car was on track.",
          approach: [
            "Developed a LoRa gateway collecting data streams from the vehicle control boards.",
            "Built a Windows dashboard that surfaces live warnings and stores telemetry for review.",
            "Added a serial fallback mode for garage flashing and diagnostics."
          ],
          result: "The team gained continuous visibility during track tests and race week without manual data pulls.",
          metrics: [
            { label: "LoRa link", value: "Up to 8 km" },
            { label: "Transport", value: "LoRa with RS232 fallback" },
            { label: "Focus", value: "Power electronics & battery telemetry" }
          ],
          caseStudy: {
            overview: "End-to-end telemetry system delivering reliable insight to the pit wall.",
            architecture: [
              "On-vehicle STM32 nodes streaming into the LoRa gateway",
              "Fallback serial channel for garage operations",
              "Desktop UI with live charts and alerts",
              "Automatic session logging"
            ],
            challenges: [
              "Maintaining signal health across long-track layouts",
              "Designing pit-side hardware that's quick to deploy",
              "Keeping the UI readable outdoors"
            ],
            lessons: [
              "Tuning LoRa parameters to track conditions prevented packet loss",
              "Field testing exposed failure modes early",
              "Clear alerts improved reaction time"
            ],
            future: [
              "Add analytics for energy prediction",
              "Extend to a web-based dashboard for the wider team"
            ]
          }
        }
      ],
      updates: [
        {
          id: "esp-relay",
          date: "2025-09",
          title: "ESP-based Wi-Fi relay module",
          summary: "Completed a remotely managed relay prototype that safely switches a 220 V AC line via Wi-Fi."
        }
      ] as UpdateEntry[]
    };
  }, [lang]);

  const handleLocalScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <SEO title={content.hero.name} description={content.hero.title} />
      <main className="home" id="top">
        <section id="hero" className="hero" data-nav-section>
          <motion.div className="hero-content" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="eyebrow">{content.hero.name}</p>
            <h1>{content.hero.title}</h1>
            <p className="value-prop">{content.hero.valueProp}</p>

            <div className="hero-ctas">
              <a
                className="button"
                href={lang === "tr" ? "/res-tr.pdf" : "/res.pdf"}
                download={lang === "tr" ? "TalhaKarasu-CV-TR.pdf" : "TalhaKarasu-CV-EN.pdf"}
              >
                {t ? t("about.downloadCV") : lang === "tr" ? "CV İndir" : "Download CV"}
              </a>
              <button className="outline-button" onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}>
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
            <h2>{lang === "tr" ? "Takım içinde üstlendiğim roller" : "Roles I take on"}</h2>
            <p>{lang === "tr" ? "Ar-Ge çalışmalarında donanım ve yazılımı birlikte ele alarak sahada doğrulanmış çözümler geliştiriyorum." : "I approach R&D holistically, ensuring hardware and firmware are validated together."}</p>
          </div>
          <div className="about-columns">
            {content.about.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section id="projects" className="section projects-section" data-nav-section>
          <div className="section-heading">
            <p className="eyebrow">{lang === "tr" ? "Projeler" : "Projects"}</p>
            <h2>{lang === "tr" ? "Problem, yaklaşım, sonuç" : "Problem, approach, result"}</h2>
            <p>{lang === "tr" ? "Aşağıdaki projeler araç üstü elektroniğin kritik noktalarında kullanılan teslim edilmiş çözümler." : "These projects shipped into the vehicle stack and solved concrete track-side problems."}</p>
          </div>
          <div className="projects-grid">
            {content.projects.map((project) => (
              <article key={project.slug} className="project-card">
                <header>
                  <span className="project-status">{project.status === "delivered" ? (lang === "tr" ? "Teslim edildi" : "Delivered") : (lang === "tr" ? "Devam ediyor" : "Ongoing")}</span>
                  <h3>{project.title}</h3>
                </header>
                <div className="project-body">
                  <p><strong>{lang === "tr" ? "Problem:" : "Problem:"}</strong> {project.problem}</p>
                  <p><strong>{lang === "tr" ? "Yaklaşım:" : "Approach:"}</strong></p>
                  <ul>
                    {project.approach.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p><strong>{lang === "tr" ? "Sonuç:" : "Result:"}</strong> {project.result}</p>
                </div>
                <div className="project-metrics">
                  {project.metrics.map((metric) => (
                    <div key={metric.label} className="metric-chip">
                      <span className="metric-value">{metric.value}</span>
                      <span className="metric-label">{metric.label}</span>
                    </div>
                  ))}
                </div>
                {project.caseStudy && (
                  <button className="text-button" onClick={() => setActiveCaseStudy(project)}>
                    {lang === "tr" ? "Detaylı incele" : "View case study"}
                  </button>
                )}
              </article>
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

        <section id="updates" className="section updates-section" data-nav-section>
          <div className="section-heading">
            <p className="eyebrow">{lang === "tr" ? "Güncellemeler" : "Updates"}</p>
            <h2>{lang === "tr" ? "Son notlar" : "Recent notes"}</h2>
          </div>
          <div className="updates-grid">
            {content.updates.map((update) => (
              <article key={update.id} className="update-card">
                <p className="update-date">{update.date}</p>
                <h3>{update.title}</h3>
                <p>{update.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="cv" className="section resources-section" data-nav-section>
          <div className="section-heading">
            <p className="eyebrow">{lang === "tr" ? "Kaynaklar" : "Resources"}</p>
            <h2>{lang === "tr" ? "Belgeler" : "Documents"}</h2>
            <p>{lang === "tr" ? "CV hazır, portföy PDF ve basın kiti yakında eklenecek." : "CV is ready; portfolio PDF and press kit are planned."}</p>
          </div>
          <div className="resources-grid">
            <a
              className="resource-card"
              href={lang === "tr" ? "/res-tr.pdf" : "/res.pdf"}
              download={lang === "tr" ? "TalhaKarasu-CV-TR.pdf" : "TalhaKarasu-CV-EN.pdf"}
            >
              <h3>{lang === "tr" ? "CV" : "CV"}</h3>
              <p>{lang === "tr" ? "Güncel özgeçmiş" : "Latest resume"}</p>
            </a>
            <div className="resource-card" aria-disabled="true">
              <h3>{lang === "tr" ? "Portföy PDF" : "Portfolio PDF"}</h3>
              <p>{lang === "tr" ? "Yakında" : "Coming soon"}</p>
            </div>
            <div className="resource-card" aria-disabled="true">
              <h3>{lang === "tr" ? "Basın kiti" : "Press kit"}</h3>
              <p>{lang === "tr" ? "Yakında" : "Coming soon"}</p>
            </div>
          </div>
        </section>

        <FooterInfo onQuickLink={handleLocalScroll} />

      </main>
      <AnimatePresence>
        {activeCaseStudy && <CaseStudyModal project={activeCaseStudy} onClose={() => setActiveCaseStudy(null)} />}
      </AnimatePresence>
    </>
  );
};

export default AboutPage;
