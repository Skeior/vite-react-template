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
            Erciyes Üniversitesi Bilgisayar Mühendisliği 4. sınıf öğrencisiyim ve gömülü sistemler ile güç elektroniği alanında kapsamlı pratik deneyime sahibim. C ve C++ dilleri ile yazılım geliştirme, Çok katmanlı devre tasarımı konularında yetkinliğe sahibim.
            </p>
            <p>
            Gömülü yazılım ve donanım tasarım süreçlerinde hem teorik bilgi hem de uygulamalı deneyim sahibi olarak, projelerde sistem entegrasyonu ve optimizasyon çalışmaları yürüttüm. Özellikle yerli ve verimli donanım-yazılım entegre sistemler geliştirmeye odaklanıp, sürdürülebilir, ölçeklenebilir ve inovatif çözümler üretmeye tutkuyla bağlıyım.
            </p>
            <p>
            Sahip olduğum teknik bilgi ve deneyimleri, verimli, ölçeklenebilir ve yenilikçi donanım-yazılım entegre sistemler geliştirmek için kullanmayı hedefliyorum.
            </p>
      </section>

      <section className="section-card">
        <h2>Yetenekler</h2>
            <ul>
            <li>Mikrodenetleyici tabanlı gömülü sistem geliştirme ve haberleşme protokolleri (C/C++, UART, SPI, I2C, HAL)</li>
            <li>PCB tasarımı ve elektronik devre entegrasyonu (Altium Designer kullanımı)</li>
            <li>BLDC motor kontrol ve sürücü tasarımı (PWM, FOC, SixStep Motor Kontrol algoritmaları)</li>
            <li>Batarya yönetim sistemleri ve enerji optimizasyonu</li>
            </ul>
      </section>
    </div>
  );
}

export default HomePage;
