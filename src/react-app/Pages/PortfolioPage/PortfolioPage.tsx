import React, { useState } from "react";
import { motion } from "framer-motion";
import "./Portfolio.css";
import { useLanguage } from "../../Components/LanguageProvider";
import LanguageToggle from "../../Components/LanguageToggle";
import SEO from "../../Components/SEO";
import FooterInfo from "../../Components/FooterInfo";

const projects = [
  {
    title: "BLDC Motor Driver for Electric Vehicle",
    description: `This project was developed under the TÜBİTAK 2209-A program 
    with the title "FOC-Based 6 Layer PID Controller for Electric Vehicles". 
    It was also presented at TÜBİTAK Teknofest Efficiency Challenge 2025 and received award.`,
    features: [
      "12-85V Input voltage",
      "0-80V / 165A Output Spec",
      "Compatible with FOC and Six-Step Algorithms",
      "Phase-to-phase Voltage Measurements",
      "Phase Current Measurements",
      "Overcurrent Protection",
      "Hall Effect and Encoder Sensor Readings",
      "6-layer PCB",
      "Size: 10x10 cm"
    ],
    technologies: [
      "Embedded C / HAL Libraries",
      "Altium Designer (PCB Design)",
      "UART & RS232 & I2C Communication",
      "Field Oriented Control (FOC)",
      "Six-Step Commutation",
    ],
    previewImage: "/images/onarka.jpg",
    images: [
      "/images/ongoruntu.jpg",
      "/images/arkagoruntu.jpg",
      "/images/layer1.png",
      "/images/layer2.png",
      "/images/layer3.png",
      "/images/layer4.png"
    ],
    videos: [
      "/images/arabavideo.mp4",
      "/images/yerlilikvideo.mp4"
    ],
    link: "https://github.com/skeior/bldc-driver"
  },
  {
    title: "Ground Station for Electric Vehicle",
    description: `This application designed for remote monitoring and telemetry of electric vehicle. The application collects
    real-time data from all on-vehicle control boards via serial communication, and transmits
    it to the ground station.`,
    features: [
      "LoRa communication (up to 8 km)",
      "Real-time Telemetry from all vehicle control boards",
      "User-friendly ground station GUI (C#)",
      "Serial communication with vehicle electronics",
      "Transmits speed, temperature, voltage, remaining energy, etc.",

      "Fail-safe data logging"
    ],
    technologies: [
      "STM32 Microcontroller",
      "LoRa Wireless Modules",
      "Embedded C / Hal",
      "UART / SPI / I2C Communication",
      "C# GUI Development"
    ],
    previewImage: "/images/lorastation_preview.jpg",
    images: [
      "/images/lorastation_1.jpg",
      "/images/lorastation_2.jpg"
    ],
    videos: [
      "/images/lorastation_demo.mp4"
    ],
    link: "https://github.com/skeior/lorastation"
  },
{
  title: "Göktim Academy - Robotics & Embedded Systems Instructor",
  description: `Introduced students to the foundations of engineering and embedded systems through interactive lessons. Demonstrated how sensors work in real life, and showed how microcontrollers communicate with external devices. Designed weekly hands-on projects.`,
  features: [
    "Teaching the basics of binary logic",
    "How sensors and components work.",
    "How microcontrollers interact with the outside world",
    "Weekly project-based learning to reinforce concepts",
    "Encouraging curiosity, teamwork, and problem-solving skills"
  ],
  technologies: [
    "Arduino",
    "C/C++",
    "STEM Education",
    "Electronics Fundamentals",
    "Mentoring & Teaching"
  ],
  previewImage: "/images/goktim_preview.jpg",
  images: [
    "/images/goktim_1.jpg",
    "/images/goktim_2.jpg"
  ],
  link: "#"
},

  {
    title: "Efficiency Challenge Participation (2022-2024)",
    description: `Participated in Teknofest Efficiency Challenge with VoltaFCEV team. 
    Started as Telemetry System member in 2022, led Motor Driver unit in 2023, 
    and served as Captain of the Hydrogen-supported Electric Vehicle in 2024.`,
    features: [
      "Telemetry System Member (2022)",
      "Motor Driver Unit Lead (2023)",
      "Vehicle Team Captain (2024)"
    ],
    technologies: [
      "STM32 Microcontrollers",
      "BLDC Motor Control",
      "LoRa Telemetry",
      "Embedded C / C++",
      "Team Leadership & Project Management"
    ],
    previewImage: "/images/efficiency_preview.jpg",
    images: [
      "/images/efficiency_2.jpeg",
      "/images/efficiency_3.jpg"
    ],
    link: "#"
  },
  {
    title: "Supported / Awarded Academic Projects",
    description: `These projects have been supported by national research funds or recognized for academic merit.`,
    features: [
      "Scientific Research Project (BAP) - Hydrogen Fuel Cell Vehicle",
      "Mini Ornithopter Design - TUSAŞ Lift-Up",
      "Mini Ornithopter Design - TÜBİTAK 2209-B Project",
      "TÜBİTAK 2209-A BLDC Driver Design - FOC-Based 6 layer PID Controller for Electric Vehicles"
    ],
    previewImage: "/images/academic_preview.jpg",
    link: "#"
  }
];

const PortfolioPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  return (
    <div className="portfolio-container">
      <SEO 
        title={t("portfolio.title")}
        description={t("portfolio.subtitle")}
      />
      <motion.header
        className="portfolio-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%" }}>
          <div>
            <h1 className="portfolio-title">{t("portfolio.title")}</h1>
            <p className="portfolio-subtitle">{t("portfolio.subtitle")}</p>
          </div>
          <LanguageToggle />
        </div>
      </motion.header>

      <div className="projects-grid">
        {projects.map((project, index) => {
          const pTrans: any = t(`projects.${index}`) || {};
          const title = pTrans?.title ?? project.title;
          const description = pTrans?.description ?? project.description;
          const features = pTrans?.features ?? project.features;
          const technologies = pTrans?.technologies ?? project.technologies;

          return (
          <motion.div
            key={index}
            className="portfolio-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={project.previewImage}
              alt={`${title} Preview`}
              className="card-preview-image"
              loading="lazy"
            />


            <h3 className="card-title">{title}</h3>

            {/* Technology badges (first 3) */}
            {technologies && technologies.length > 0 && (
              <div className="tech-badges">
                {technologies.slice(0, 3).map((tech: string, i: number) => (
                  <span className="tech-badge" key={i}>{tech}</span>
                ))}
              </div>
            )}

            <p className="card-description">{description}</p>

            <ul className="card-features">
              {features.slice(0, 3).map((f: string, i: number) => (
                <li key={i}>{f}</li>
              ))}
            </ul>

            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="show-more-btn"
            >
              {openIndex === index ? t("portfolio.showLess") : t("portfolio.showDetails")}
            </button>

            {openIndex === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="card-details"
              >
                <ul>
                  {features.slice(3).map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>

                {technologies && (
                  <div className="project-technologies">
                    <h4>{t("portfolio.technologiesUsed")}</h4>
                    <ul>
                      {technologies.map((tech: string, i: number) => (
                        <li key={i}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {project.images && (
                  <div className="project-images">
                    {project.images.map((img, i) => (
                      <img key={i} src={img} alt={`${title} ${i}`} loading="lazy" />
                    ))}
                  </div>
                )}

                {project.videos && (
                  <div className="project-videos">
                    <h4>{t("portfolio.videos")}</h4>
                    {project.videos.map((vid, i) => (
                      <video key={i} controls width="300" preload="none">
                        <source src={vid} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ))}
                  </div>
                )}

                {project.link && project.link !== "#" && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    {t("portfolio.githubRepository")}
                  </a>
                )}
              </motion.div>
            )}
          </motion.div>
          );
        })}
      </div>

      <FooterInfo />
    </div>
  );
};

export default PortfolioPage;
