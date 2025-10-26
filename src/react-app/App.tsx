import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import AboutPage from "./Pages/AboutPage/About";
import PortfolioPage from "./Pages/PortfolioPage/PortfolioPage";
import ContactPage from "./Pages/ContactPage/ContactPage";
import "./App.css";
import { useEffect, useRef, useLayoutEffect } from "react";
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
  useLayoutEffect(() => {
    let mounted = true;
    if (!vantaRef.current) return;
    // If there is an existing vanta effect (from HMR or previous init), destroy it first
    if (vantaEffect.current && typeof vantaEffect.current.destroy === 'function') {
      try {
        vantaEffect.current.destroy();
      } catch (e) {
        // ignore
      }
      vantaEffect.current = null;
    }

    Promise.all([
      import("vanta/dist/vanta.net.min"),
      import("three")
    ])
      .then(([VANTA, THREE]) => {
        if (!mounted || !vantaRef.current) return;
        const NET = (VANTA as any).default || (VANTA as any).NET || VANTA;
        const three = (THREE as any).default || THREE;

        // Defensive: ensure THREE.Material prototype has a default for vertexColors
        // so that when Vanta creates materials it doesn't pass `undefined` and
        // trigger the console warning. Setting the prototype property here is
        // best-effort and safe — it only defines the default when materials
        // inspect the prototype.
        try {
          if (three && (three as any).Material && (three as any).Material.prototype) {
            (three as any).Material.prototype.vertexColors = false;
          }
        } catch (e) {
          // ignore — best-effort
        }

        try {
          const accent = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#e3342f').trim();
          const bg = (getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#071125').trim();

          // Reduced density: lower points and maxDistance to make the net lighter
          vantaEffect.current = NET({
            el: vantaRef.current,
            THREE: three,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: accent || '#e3342f',
              // use the CSS background color as the default; we'll make the renderer clear color
              // transparent after initialization to avoid passing the string 'transparent'
              backgroundColor: bg || '#071125',
            // Custom user-requested Vanta.NET density
            points: 9.0,
            maxDistance: 20.0,
            spacing: 15.0
          });
            // Try to make the Three renderer use a transparent clear color so the canvas
            // only draws the nets and lets the CSS container background show through.
            try {
              const renderer = vantaEffect.current && (vantaEffect.current as any).renderer;
              if (renderer && typeof renderer.setClearColor === 'function') {
                // setClearColor accepts (color, alpha). Use numeric color and 0 alpha.
                renderer.setClearColor(0x000000, 0);
              }

              // Normalize materials helper — traverses scene and fixes undefined vertexColors
              const normalizeMaterials = () => {
                try {
                  const scene = vantaEffect.current && (vantaEffect.current as any).scene;
                  if (scene && typeof scene.traverse === 'function') {
                    scene.traverse((obj: any) => {
                      try {
                        if (obj && obj.isMesh && obj.material) {
                          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                          mats.forEach((mat: any) => {
                            if (mat && typeof mat.vertexColors === 'undefined') {
                              mat.vertexColors = false;
                              mat.needsUpdate = true;
                            }
                          });
                        }
                      } catch (inner) {
                        // ignore per-object failures
                      }
                    });
                  }
                } catch (innerAll) {
                  // ignore
                }
              };

              // Run normalization immediately and a few times after to catch materials
              // that Vanta may create asynchronously (HMR/dev timing). These retries
              // are lightweight and safe.
              normalizeMaterials();
              setTimeout(normalizeMaterials, 50);
              setTimeout(normalizeMaterials, 200);
              setTimeout(normalizeMaterials, 600);
              // Also run on next animation frames a couple of times.
              requestAnimationFrame(() => normalizeMaterials());
              requestAnimationFrame(() => requestAnimationFrame(() => normalizeMaterials()));
            } catch (e) {
              // ignore failures — this is best-effort and non-critical
            }
        } catch (err) {
          // ignore runtime errors
        }
      })
      .catch(() => {
        // ignore import errors
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
        {/* Decorative background: render Vanta only when enabled; render SVG only when disabled
            This ensures only Vanta.NET runs when background is enabled and prevents
            the SVG/CSS animations from appearing together with Vanta. */}
        <div className="bg-decor" aria-hidden="true">
          <div ref={vantaRef} className="vanta-container" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
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
