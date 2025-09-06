import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <motion.header
        className="text-center mb-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-bold mb-2">Talha Karasu</h1>
        <p className="text-lg text-gray-600">
          Embedded Systems & Power Electronics R&D Engineer
        </p>
      </motion.header>

      {/* About */}
      <motion.section
        className="mb-12 text-center"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-semibold mb-4">Hakkımda</h2>
        <p>
          Erciyes Üniversitesi Bilgisayar Mühendisliği 4. sınıf öğrencisiyim.
          Gömülü sistemler ve güç elektroniği alanında çalışıyorum. Efficiency
          Challenge yarışmalarında telemetri sistemleri ve BLDC motor sürücü
          tasarımları yaptım. Şu anda Hidromobil kategorisi takım kaptanı olarak
          görev almaktayım.
        </p>
      </motion.section>

      {/* Skills */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">Yetenekler</h2>
        <ul className="list-disc list-inside space-y-2 text-left mx-auto max-w-md">
          <motion.li whileHover={{ scale: 1.05 }}>
            C / C++ ile gömülü yazılım geliştirme
          </motion.li>
          <motion.li whileHover={{ scale: 1.05 }}>
            STM32 (HAL, DMA, UART, SPI, I2C)
          </motion.li>
          <motion.li whileHover={{ scale: 1.05 }}>
            PCB Tasarımı (Altium Designer)
          </motion.li>
          <motion.li whileHover={{ scale: 1.05 }}>
            BLDC Motor Sürücü Tasarımı
          </motion.li>
          <motion.li whileHover={{ scale: 1.05 }}>
            Batarya Yönetim Sistemleri
          </motion.li>
        </ul>
      </motion.section>

      {/* Contact */}
      <motion.section
        className="text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-semibold mb-4">İletişim</h2>
        <p>
          <a
            href="mailto:talhakarasu2@gmail.com"
            className="text-blue-600 underline"
          >
            talhakarasu2@gmail.com
          </a>
        </p>
        <p className="mt-2">
          <a
            href="https://github.com/skeior"
            className="text-blue-600 underline"
          >
            GitHub
          </a>
          {" | "}
          <a
            href="https://linkedin.com/in/talhakarasu"
            className="text-blue-600 underline"
          >
            LinkedIn
          </a>
        </p>
        <div className="mt-4">
          <Link
            to="/contact"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            İletişim Sayfası
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
