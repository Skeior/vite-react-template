import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import AboutPage from "./Pages/AboutPage/About";
import PortfolioPage from "./Pages/PortfolioPage/PortfolioPage";
import ContactPage from "./Pages/ContactPage/ContactPage";
import "./App.css";
import React, { useEffect, useRef } from "react";
import { useLanguage } from "./Components/LanguageProvider";
import LanguageToggle from "./Components/LanguageToggle";

function App() {
  const { t } = useLanguage();
  const geoRef = useRef<SVGSVGElement | null>(null);
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const vantaEffect = useRef<any>(null);
  
  useEffect(() => {
    let rafId = 0 as number | undefined;
    let lastY = window.scrollY;
    const speed = 0.12; // parallax intensity

    const onScroll = () => {
      lastY = window.scrollY;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (geoRef.current) {
          // move background slightly in opposite direction for depth
          const translate = Math.round(lastY * speed);
          geoRef.current.style.transform = `translate3d(0, ${translate * 0.2}px, 0)`;
        }
        rafId = 0;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // set initial position
    if (geoRef.current) geoRef.current.style.transform = `translate3d(0, ${Math.round(window.scrollY * speed * 0.2)}px, 0)`;

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
  
  // Initialize Vanta.NET background (dynamic import so it only runs in browser)
  useEffect(() => {
    let mounted = true;
    if (vantaEffect.current) return;
    if (!vantaRef.current) return;

    Promise.all([
      import("vanta/dist/vanta.net.min"),
      import("three")
    ])
      .then(([VANTA, THREE]) => {
        if (!mounted || !vantaRef.current) return;
        const NET = (VANTA as any).default || (VANTA as any).NET || VANTA;
        const three = (THREE as any).default || THREE;

        try {
          const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#7c3aed';
          const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#071125';

          vantaEffect.current = NET({
            el: vantaRef.current,
            THREE: three,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.0,
            scaleMobile: 1.0,
            color: accent.trim() || '#7c3aed',
            backgroundColor: bg.trim() || '#071125',
            points: 12.0,
            maxDistance: 24.0,
            spacing: 20.0
          });
        } catch (err) {
          // ignore runtime errors
          // console.warn('Vanta init failed', err);
        }
      })
      .catch((err) => {
        // console.warn('Vanta import failed', err);
      });

    return () => {
      mounted = false;
      if (vantaEffect.current && typeof vantaEffect.current.destroy === 'function') {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        {/* Decorative geometric background (non-interactive) */}
        <div className="bg-decor" aria-hidden="true">
          <svg ref={geoRef} className="geo-illustration" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            {/* New layered SVG: three offset soft polygons plus accent circles for sparkle */}
            <g>
              <rect x="0" y="0" width="1200" height="800" fill="var(--layer-1)" className="layer layer-1" />

              <path className="layer layer-2" d="M0,160 C220,40 420,120 600,80 C820,30 980,110 1200,50 L1200,800 L0,800 Z" fill="var(--layer-2)" opacity="0.98" />

              <path className="layer layer-3" d="M0,320 C180,220 380,300 580,260 C820,200 980,300 1200,240 L1200,800 L0,800 Z" fill="var(--layer-3)" opacity="0.96" />

              {/* Accent circles for subtle highlights */}
              <g className="accents" opacity="0.65">
                <circle cx="240" cy="120" r="46" fill="var(--accent)" opacity="0.08" />
                <circle cx="920" cy="60" r="60" fill="var(--accent-2)" opacity="0.06" />
                <circle cx="720" cy="340" r="32" fill="var(--accent)" opacity="0.05" />
              </g>
            </g>
          </svg>
        </div>
  {/* Navbar */}
        <nav className="navbar">
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
              {t("nav.home")}
            </NavLink>
            <NavLink to="/portfolio" className={({ isActive }) => (isActive ? "active" : "")}>
              {t("nav.portfolio")}
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>
              {t("nav.contact")}
            </NavLink>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <LanguageToggle />
          </div>
        </nav>

        {/* App Container */}
        <div className="app-container">
          <Routes>
            <Route path="/" element={<AboutPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </div>

        {/* Scroll to Top */}
        <ScrollToTop />
      </div>
    </BrowserRouter>
  );
}

export default App;
