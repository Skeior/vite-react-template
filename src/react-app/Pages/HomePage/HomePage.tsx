import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div>
      {/* Header */}
      <header className="section-card" style={{ textAlign: "center" }}>
        <h1>Talha Karasu</h1>
        <p>Embedded Systems & Power Electronics R&D Engineer</p>
        <Link to="/contact" className="button" style={{ marginTop: "15px" }}>
          İletişim
        </Link>
      </header>

      {/* About / Skills */}
      <section className="section-card">
        <h2>Hakkımda</h2>
        <p>
          Erciyes Üniversitesi Bilgisayar Mühendisliği 4. sınıf öğrencisiyim.
          Gömülü sistemler ve güç elektroniği alanında çalışıyorum. Efficiency Challenge yarışmalarında telemetri sistemleri ve BLDC motor sürücü tasarımları yaptım. Şu anda Hidromobil kategorisi takım kaptanı olarak görev almaktayım.
        </p>
      </section>

      <section className="section-card">
        <h2>Yetenekler</h2>
        <ul>
          <li>C / C++ ile gömülü yazılım geliştirme</li>
          <li>STM32 (HAL, DMA, UART, SPI, I2C)</li>
          <li>PCB Tasarımı (Altium Designer)</li>
          <li>BLDC Motor Sürücü Tasarımı</li>
          <li>Batarya Yönetim Sistemleri</li>
        </ul>
      </section>
    </div>
  );
}

export default HomePage;
