import React from "react";
import { motion } from "framer-motion";
import "./Portfolio.css";

const projects = [
  {
    title: "BLDC Motor Sürücü Tasarımı",
    desc: "STM32G431RBT6 tabanlı, tamamen yerli tasarlanmış BLDC motor sürücü geliştirdim.",
    link: "https://github.com/skeior/bldc-driver",
  },
  {
    title: "Telemetri Sistemi",
    desc: "Araç verilerini TTL UART üzerinden toplayıp LoRa ile 1.5 km mesafeden ilettim.",
    link: "https://github.com/skeior/telemetry-system",
  },
  {
    title: "Batarya Dengeleme Devresi",
    desc: "STM32F407 ve INA2134UA kullanarak 20 hücreli Li-Po batarya için pasif dengeleme devresi.",
    link: "https://github.com/skeior/bms-balancing",
  },
  {
    title: "Mini Ornihopter (Bitirme Projesi)",
    desc: "Kanat çırpma hareketi ile doğal görünümlü, kamera ile görüntü aktarabilen hava aracı.",
    link: "https://github.com/skeior/ornihopter",
  },
];

const PortfolioPage: React.FC = () => {
  return (
    <div className="portfolio-container">
      {/* Header */}
      <motion.header
        className="portfolio-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="portfolio-title">Projelerim</h1>
        <p className="portfolio-subtitle">
          Embedded Systems & Power Electronics projelerim
        </p>
      </motion.header>

      {/* Project Cards */}
      <motion.section
        className="portfolio-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.2 } },
        }}
      >
        {projects.map((project, idx) => (
          <motion.a
            key={idx}
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="portfolio-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="card-title">{project.title}</h3>
            <p className="card-desc">{project.desc}</p>
          </motion.a>
        ))}
      </motion.section>
    </div>
  );
};

export default PortfolioPage;
