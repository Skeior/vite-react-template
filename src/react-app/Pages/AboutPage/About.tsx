import React, { useEffect } from "react";
import { FaMicrochip, FaProjectDiagram, FaCogs, FaBatteryHalf, FaCar, FaStar } from "react-icons/fa";
import Timeline from "../Timeline/Timeline";
import { motion } from "framer-motion";
import "./About.css";
import { useLanguage } from "../../Components/LanguageProvider";
import SEO from "../../Components/SEO";

const skillIcons = [<FaMicrochip />, <FaProjectDiagram />, <FaCogs />, <FaBatteryHalf />, <FaCar />];

const AboutPage: React.FC = () => {
  const { t, lang } = useLanguage();
  
  // Get skills from translations or use empty array as fallback
  const translatedSkills: any = t("about.skills");
  const skills = Array.isArray(translatedSkills) ? translatedSkills : [];

  useEffect(() => {
    const fadeInElements = document.querySelectorAll(".fade-in");

    const handleScroll = () => {
      fadeInElements.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (top < windowHeight - 100) {
          el.classList.add("visible");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <SEO 
        title={t("about.name")}
        description={t("about.subtitle")}
      />
          <motion.header
            className="portfolio-header"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="portfolio-title">{t("about.name")}</h1>
            <p className="portfolio-subtitle">{t("about.subtitle")}</p>
          </motion.header>
      <div className="about-skill-container fade-in">
        <section className="about-card about-summary">
          <h2>{t("about.aboutHeading")}</h2>
          {Array.isArray(t("about.paragraphs")) ? (
            (t("about.paragraphs") as any[]).map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))
          ) : (
            <>
              <p>
                Erciyes University, final-year Computer Engineering student with practical experience in embedded systems and power electronics. Skilled in C and C++ programming and multi-layer PCB design.
              </p>
              <p>
                Experienced in both theoretical knowledge and hands-on embedded software & hardware design. Focused on local and efficient hardware-software integrated systems development, aiming for scalable and innovative solutions.
              </p>
              <p>
                My goal is to leverage technical skills and practical experience to build efficient, scalable, and innovative hardware-software integrated systems.
              </p>
            </>
          )}
          {/* Serve English CV by default; if language is Turkish, attempt to download Turkish CV.
              Place `res.pdf` (English) and `res-tr.pdf` (Turkish) in the `public/` folder.
              We use a friendly suggested download filename so users get a descriptive file name
              (the server file name can remain `res.pdf` / `res-tr.pdf`). */}
          <a
            href={lang === "tr" ? "/res-tr.pdf" : "/res.pdf"}
            download={lang === "tr" ? "TalhaKarasu-CV-TR.pdf" : "TalhaKarasu-CV-EN.pdf"}
            className="button"
          >
            {t("about.downloadCV")}
          </a>
        </section>

        <section className="about-card about-skills">
          <h2>{t("about.skillsHeading")}</h2>
          <ul>
            {skills.map((skill: any, idx: number) => (
              <li key={idx} className="skill-item">
                <span className="skill-icon">{skillIcons[idx] || <FaMicrochip />}</span>
                <span className="skill-text-container">
                  <span className="skill-label">{skill.label}</span>
                  <span className="skill-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FaStar key={i} className={i < (skill.stars || 0) ? "filled" : ""} />
                    ))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="timeline-container fade-in">
        <section className="about-timeline section-card">
          <Timeline />
        </section>
      </div>
    </>
  );
};

export default AboutPage;
