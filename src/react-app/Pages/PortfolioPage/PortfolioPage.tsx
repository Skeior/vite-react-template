import React, { useState } from "react";
import { motion } from "framer-motion";
import "./Portfolio.css";
import { useLanguage } from "../../Components/LanguageProvider";
import SEO from "../../Components/SEO";
import CaseStudyModal from "../../Components/CaseStudyModal";
import FooterInfo from "../../Components/FooterInfo";

const projects = [
  {
    title: "ESP-based Smart Plug (WiFi Controlled)",
    description: `Designed and developed multiple hardware variants of a WiFi-controlled smart plug using ESP microcontrollers. The device accepts 220V AC input and provides switched 220V outputs rated up to 16A per channel. Controlled via a mobile application (WiFi) with support for OTA firmware updates and optional energy monitoring. I contributed primarily to the hardware design and PCB layouts, producing 1-channel, 2-channel and 3-channel variants to suit different use cases.`,
    features: [
      "220V AC input",
      "Up to 16 A per channel switching capability",
      "ESP32 / ESP8266 based firmware",
      "MOSFET / Solid-state relay switching options",
      "Overcurrent & thermal protection",
      "OTA firmware updates",
      "Mobile app control (WiFi) and MQTT/HTTP APIs",
      "Different 1/2/3 channel hardware variants"
    ],
    // These feature items should be hidden from the card preview and only
    // shown in the details modal when the user clicks "Show Details".
    detailsOnlyFeatures: [
      "220V AC input",
      "Up to 16 A per channel switching capability",
      "ESP32 / ESP8266 based firmware",
      "Solid-state relay switching options",
      "thermal protection",
      "OTA firmware updates"
    ],
    technologies: [
      "ESP32 / ESP8266",
      "Embedded C / Arduino framework",
      "Altium Designer (PCB) / Easy Eda",
      "Mobile app integration"
    ],
    highlights: [
      "1 / 2 / 3 channel designs",
      "220V · 16A per channel",
      "WiFi control"
    ],
    previewImage: "/images/intern6.png",
    images: [
      "/images/intern1.png",
      "/images/intern2.png",
      "/images/intern3.png",
      "/images/intern4.png",
      "/images/intern5.png",
      "/images/intern6.png",
      "/images/intern7.png"
    ],
    link: "#"
  },
  {
    title: "Battery Management System (BMS)",
    description: `In-house designed 10x10 cm, 6-layer BMS for a 14s pack. Features ADC-based cell voltage monitoring, NTC temperature sensing, multiplexer-controlled MOSFET passive balancing, UART integration with vehicle control systems and on-board charger, and fail-safe shutdown on communication loss.`,
    features: [
      "ADC-based monitoring for 14 cells",
      "NTC temperature sensing and automatic cutoff",
      "Multiplexer-controlled MOSFET passive balancing",
      "UART communication with VCS & On-Board Charger",
      "Fail-safe automatic shutdown on comms loss"
    ],
    technologies: [
      "STM32 / Embedded C",
      "Altium Designer (PCB)",
      "ADC / NTC sensors",
      "UART / Serial integration"
    ],
    highlights: [
      "6-layer · 10x10 cm PCB",
      "14s pack monitoring",
      "Passive balancing"
    ],
    previewImage: "/images/bms1.jpeg",
    images: [
      "/images/bms1.jpeg",
      "/images/bms2.jpeg",
      "/images/bms3.jpeg",
      "/images/bms4.jpeg"
    ],
    link: "#"
  },
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
    highlights: [
      "12-85 V input range",
      "0-80 V / 165 A output",
      "10x10 cm · six layers"
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
    highlights: [
      "Up to 8 km LoRa",
      "Real-time telemetry",
      "C# ground GUI"
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
    highlights: ["Hands-on projects","Sensor demos","Weekly exercises"],
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
    highlights: ["Team captain","Motor driver lead","Telemetry member"],
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
    highlights: ["Research-funded","TÜBİTAK support","Academic awards"],
    link: "#"
  }
];

const PortfolioPage: React.FC = () => {
  const [activeCaseStudy, setActiveCaseStudy] = useState<any | null>(null);
  const { t } = useLanguage();

  // Build structured data (ItemList of CreativeWork) for SEO / AI consumption
  const siteBase = 'https://talhakarasu.com';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': t("portfolio.title"),
    'description': t("portfolio.subtitle"),
    'url': `${siteBase}/portfolio`,
    'mainEntity': {
      '@type': 'ItemList',
      'itemListElement': projects.map((p, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'url': p.link && p.link !== '#' ? p.link : `${siteBase}/portfolio#project-${i}`,
        'item': {
          '@type': 'CreativeWork',
          'name': p.title,
          'description': p.description,
          'image': p.previewImage ? `${siteBase}${p.previewImage}` : undefined,
          // add optional richer fields
          'datePublished': (p as any).datePublished || (p as any).year || '2024',
          'author': {
            '@type': 'Person',
            'name': 'Talha Karasu',
            'url': 'https://talhakarasu.com'
          },
          'keywords': (p.technologies || []).slice(0,10).join(', ')
        }
      }))
    }
  };

  return (
    <div className="portfolio-container">
      <SEO 
        title={t("portfolio.title")}
        description={t("portfolio.subtitle")}
        url={`${siteBase}/portfolio`}
        image={`${siteBase}${projects[0]?.previewImage ?? '/images/og-image.svg'}`}
        structuredData={structuredData}
      />
      <motion.header
        className="portfolio-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <div>
            <h1 className="portfolio-title">{t("portfolio.title")}</h1>
            <p className="portfolio-subtitle">{t("portfolio.subtitle")}</p>
          </div>
        </div>
      </motion.header>

      <section id="projects" className="section projects-section">
        {/* Optional in-section heading could be added here if desired */}

        <div className="portfolio-pairs">
        {(() => {
          const rows: any[] = [];
          // group projects in rows of 3 so we can display three cards per row
          for (let i = 0; i < projects.length; i += 3) {
            rows.push(projects.slice(i, i + 3));
          }

          return rows.map((row, rowIndex) => (
            <div className="project-pair" key={rowIndex}>
              <div className="pair-grid">
                {row.map((project: any, colIndex: number) => {
                  const index = rowIndex * 3 + colIndex;
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

                      {/* Highlight chips sourced from `highlights` field (fallback to first 3 features) */}
                      {((project.highlights && project.highlights.length > 0) ? project.highlights : features.slice(0,3)).length > 0 && (
                        <div className="project-highlights" aria-hidden={false}>
                          {((project.highlights && project.highlights.length > 0) ? project.highlights : features.slice(0,3)).map((f: string, i: number) => (
                            <span className="highlight-chip" key={i} role="note">{f}</span>
                          ))}
                        </div>
                      )}

                      {/* Feature bullets intentionally hidden from card preview —
                          details are shown in the modal when the user clicks "Show Details" */}

                      <button
                        onClick={() => {
                          // Debug: log which project is being opened to diagnose image mixing
                          // Remove this after debugging is complete
                          // eslint-disable-next-line no-console
                          console.log('Open project:', index, project.title, project.images);
                          setActiveCaseStudy(project);
                        }}
                        className="show-more-btn"
                      >
                        {t("portfolio.showDetails")}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ));
        })()}
  </div>
  </section>

    {activeCaseStudy && (
        <CaseStudyModal project={activeCaseStudy} onClose={() => setActiveCaseStudy(null)} />
      )}

      <FooterInfo />
    </div>
  );
};

export default PortfolioPage;
