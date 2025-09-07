// HomePage.tsx
import { Link } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Talha Karasu</h1>
          <p>Embedded Systems & Power Electronics R&D Engineer</p>
          <div className="hero-buttons">
            <Link to="/" className="button">
              Hakkımda
            </Link>
            <Link to="/contact" className="button button-secondary">
              İletişim
            </Link>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="skills-section">
        <h2>Yeteneklerim</h2>
        <div className="skills-cards">
          <div className="skill-card">
            <h3>Gömülü Sistemler</h3>
            <p>Mikrodenetleyici tabanlı projeler (C/C++, STM32, UART, SPI, I2C)</p>
          </div>
          <div className="skill-card">
            <h3>PCB & Elektronik</h3>
            <p>Altium Designer ile PCB tasarımı ve devre entegrasyonu</p>
          </div>
          <div className="skill-card">
            <h3>Motor Kontrol</h3>
            <p>BLDC sürücü tasarımı, FOC ve PID algoritmaları</p>
          </div>
          <div className="skill-card">
            <h3>Batarya & Enerji</h3>
            <p>Batarya yönetimi ve enerji optimizasyonu</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Link to="/" className="button">
          Detaylı Timeline ve Projeler
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
