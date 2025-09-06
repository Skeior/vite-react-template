import "./App.css";
import { motion } from "framer-motion";

function App() {
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
        className="mb-12"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-semibold mb-4">Hakkımda</h2>
        <p>
          Erciyes Üniversitesi Bilgisayar Mühendisliği 4. sınıf öğrencisiyim.
          Gömülü sistemler, güç elektroniği üzerine çalışıyorum. Efficiency
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
        <h2 className="text-2xl font-semibold mb-4">Yetenekler</h2>
        <ul className="list-disc list-inside space-y-2 text-left mx-auto max-w-md">
          <motion.li whileHover={{ scale: 1.05 }}>C / C++ ile gömülü yazılım geliştirme</motion.li>
          <motion.li whileHover={{ scale: 1.05 }}>STM32 (HAL, DMA, UART, SPI, I2C)</motion.li>
          <motion.li whileHover={{ scale: 1.05 }}>PCB Tasarımı (Altium Designer)</motion.li>
          <motion.li whileHover={{ scale: 1.05 }}>BLDC Motor Sürücü Tasarımı</motion.li>
          <motion.li whileHover={{ scale: 1.05 }}>Batarya Yönetim Sistemleri</motion.li>
        </ul>
      </motion.section>

      {/* Projects */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ staggerChildren: 0.3, duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-semibold mb-4">Projeler</h2>
        <div className="space-y-6">
          {[
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
          ].map((project, idx) => (
            <motion.div
              key={idx}
              className="p-4 border rounded-lg shadow-md hover:shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-xl font-bold mb-2">{project.title}</h3>
              <p>{project.desc}</p>
            </motion.div>
          ))}
        </div>
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
        <p>
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
      </motion.section>
    </div>
  );
}

export default App;
