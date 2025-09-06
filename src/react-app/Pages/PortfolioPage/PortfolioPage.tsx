import React from "react";
import { motion } from "framer-motion";

const projects = [
  {
    title: "BLDC Motor Sürücü Tasarımı",
    desc: "STM32G431RBT6 tabanlı, tamamen yerli tasarlanmış BLDC motor sürücü geliştirdim. Güç elektroniği, akım ölçümü ve kontrol algoritmalarını içeriyor.",
  },
  {
    title: "Telemetri Sistemi",
    desc: "Araç verilerini TTL UART üzerinden toplayıp LoRa modülü ile 1.5 km mesafeden yer istasyonuna ilettim.",
  },
  {
    title: "Batarya Dengeleme Devresi",
    desc: "STM32F407 ve INA2134UA kullanarak 20 hücreli Li-Po batarya için mikrodenetleyici kontrollü pasif dengeleme devresi tasarladım.",
  },
  {
    title: "Mini Ornihopter (Bitirme Projesi)",
    desc: "Kanat çırpma hareketi ile doğal görünümlü, kamufle olabilen ve kamera ile görüntü aktarabilen bir hava aracı geliştirme üzerine çalışıyorum.",
  },
];

const PortfolioPage: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <motion.header
        className="text-center mb-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-bold mb-2">Projelerim</h1>
        <p className="text-lg text-gray-600">
          Embedded Systems & Power Electronics projelerim
        </p>
      </motion.header>

      {/* Project Cards */}
      <motion.section
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.2 } },
        }}
      >
        {projects.map((project, idx) => (
          <motion.div
            key={idx}
            className="p-4 border rounded-lg shadow-md hover:shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
            whileHover={{ scale: 1.03 }}
          >
            <h3 className="text-xl font-bold mb-2">{project.title}</h3>
            <p>{project.desc}</p>
          </motion.div>
        ))}
      </motion.section>
    </div>
  );
};

export default PortfolioPage;
