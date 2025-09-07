import React, { useState } from "react";
import { motion } from "framer-motion";
import "./Portfolio.css";

const motorDriverProject = {
  title: "BLDC Motor Sürücü Tasarımı",
  features: [
    "12-85V Input voltage",
    "20V-80V / 165A Output Spec",
    "Compatitible With FOC and SixStep Algorithms",
    "Phase-to-phase Voltage measurements",
    "Phase current Measurements",
    "Overcurrent protection",
    "UART-TTL & RS232 Communication",
    "Hall Effect and Encoder Sensor readings",
    "6-layer PCB",
    "10x10 cm boyutunda kart"
  ],
  simulation: "LTspice simülasyonları ile MOSFET anahtarlama davranışı ve motor akım dalgalanmaları analiz edilmiştir.",
  test: "Motor Pilot yazılımı ile yüksüz ve yük altında testler gerçekleştirilmiş, nominal verim %99,6 olarak ölçülmüştür.",
  previewImage: "/images/onarka.jpg", // ÖN İZLEME GÖRSELİ
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
};

const PortfolioPage: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-container">
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

      <motion.div
        className="portfolio-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
      >
        {/* ÖN İZLEME GÖRSELİ */}
        <img
          src={motorDriverProject.previewImage}
          alt="Motor Driver Preview"
          className="card-preview-image"
        />

        <h3 className="card-title">{motorDriverProject.title}</h3>

        {/* Öne çıkan özellikler */}
        <ul className="card-features">
          {motorDriverProject.features.slice(0, 3).map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>

        {/* Daha fazla göster butonu */}
        <button onClick={() => setOpen(!open)} className="show-more-btn">
          {open ? "Daha az göster" : "Detayları göster"}
        </button>

        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="card-details"
          >
            <ul>
              {motorDriverProject.features.slice(3).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>

            <h4>Simülasyon Çalışmaları</h4>
            <p>{motorDriverProject.simulation}</p>

            <h4>Test ve Verim</h4>
            <p>{motorDriverProject.test}</p>

            <div className="project-images">
              {motorDriverProject.images.map((img, i) => (
                <img key={i} src={img} alt={`Motor Driver ${i}`} />
              ))}
            </div>

            <div className="project-videos">
              <h4>Videolar</h4>
              {motorDriverProject.videos.map((vid, i) => (
                <video key={i} controls width="300">
                  <source src={vid} type="video/mp4" />
                  Tarayıcınız video etiketini desteklemiyor.
                </video>
              ))}
            </div>

            <a
              href={motorDriverProject.link}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link"
            >
              GitHub Repository
            </a>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PortfolioPage;
