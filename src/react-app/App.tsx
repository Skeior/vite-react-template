import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import RadioPlayer from "./Components/RadioPlayer";
import AboutPage from "./Pages/AboutPage/About";
import PortfolioPage from "./Pages/PortfolioPage/PortfolioPage";
import ContactPage from "./Pages/ContactPage/ContactPage";
import "./App.css";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "./Components/LanguageProvider";
import LanguageToggle from "./Components/LanguageToggle";

const AppLayout: React.FC = () => {
  const { t, lang } = useLanguage();
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const vantaEffect = useRef<any>(null);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const pendingScrollId = useRef<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleAnchorNav = useCallback(
    (id: string) => {
      if (location.pathname !== "/") {
        pendingScrollId.current = id;
        navigate("/");
        return;
      }
      scrollToSection(id);
    },
    [location.pathname, navigate, scrollToSection]
  );

  useEffect(() => {
    if (location.pathname === "/" && pendingScrollId.current) {
      const target = pendingScrollId.current;
      pendingScrollId.current = null;
      window.setTimeout(() => {
        scrollToSection(target);
      }, 120);
    }
  }, [location.pathname, scrollToSection]);

  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const target = location.hash.replace("#", "");
      if (target) {
        window.setTimeout(() => scrollToSection(target), 120);
      }
    }
  }, [location.pathname, location.hash, scrollToSection]);

  useEffect(() => {
    // Ensure every route change starts at the top of the page
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("none");
      return;
    }

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-section]"));
    if (!sections.length) return;

    let ticking = false;

    const updateActive = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const viewportOffset = window.innerHeight * 0.35;
        const scrollPosition = window.scrollY + viewportOffset;
        let currentId = sections[0]?.id ?? "hero";

        for (const section of sections) {
          if (section.offsetTop <= scrollPosition) {
            currentId = section.id;
          } else {
            break;
          }
        }

        setActiveSection(currentId);
        ticking = false;
      });
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [location.pathname, lang]);

  useLayoutEffect(() => {
    let mounted = true;
    if (!vantaRef.current) return;

    if (vantaEffect.current && typeof vantaEffect.current.destroy === "function") {
      try {
        vantaEffect.current.destroy();
      } catch (e) {
        // ignore
      }
      vantaEffect.current = null;
    }

    Promise.all([import("vanta/dist/vanta.net.min"), import("three")])
      .then(([VANTA, THREE]) => {
        if (!mounted || !vantaRef.current) return;
        const NET = (VANTA as any).default || (VANTA as any).NET || VANTA;
        const three = (THREE as any).default || THREE;

        try {
          const accent = (getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#e3342f").trim();
          const bg = (getComputedStyle(document.documentElement).getPropertyValue("--bg") || "#071125").trim();

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
            color: accent,
            backgroundColor: bg,
            points: 9.0,
            maxDistance: 20.0,
            spacing: 15.0
          });

          try {
            const renderer = vantaEffect.current && (vantaEffect.current as any).renderer;
            if (renderer && typeof renderer.setClearColor === "function") {
              renderer.setClearColor(0x000000, 0);
            }
          } catch (e) {
            // ignore
          }
        } catch (err) {
          // ignore
        }
      })
      .catch(() => {
        // ignore import errors
      });

    return () => {
      mounted = false;
      if (vantaEffect.current && typeof vantaEffect.current.destroy === "function") {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  interface AnchorItem {
    id: string;
    label: string;
    mobileVisible?: boolean;
  }

  const anchorItems: AnchorItem[] = useMemo(
    () => [
      { id: "hero", label: t("nav.hero"), mobileVisible: true },
      { id: "about", label: t("nav.about") },
      { id: "timeline", label: t("nav.timeline") }
    ],
    [t]
  );

  useEffect(() => {
    if (location.pathname !== "/") {
      return;
    }

    const baseTitle = lang === "tr" ? "Talha Karasu - Gömülü Sistemler" : "Talha Karasu - Embedded Systems";
    const current = anchorItems.find((item) => item.id === activeSection);
    document.title = current ? `${current.label} | ${baseTitle}` : baseTitle;
  }, [activeSection, anchorItems, lang, location.pathname]);

  return (
    <div className="app-wrapper">
      <div className="bg-decor" aria-hidden="true">
        <div ref={vantaRef} className="vanta-container" />
      </div>

      <nav className="navbar" role="navigation">
        <div className="nav-links">
          {anchorItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${location.pathname === "/" && activeSection === item.id ? "active" : ""}`.trim()}
              data-mobile-hide={item.mobileVisible ? undefined : "true"}
              onClick={() => handleAnchorNav(item.id)}
              aria-current={location.pathname === "/" && activeSection === item.id ? "true" : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <NavLink to="/portfolio" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`.trim()}>
            {t("nav.portfolio")}
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`.trim()}>
            {t("nav.contact")}
          </NavLink>
          <LanguageToggle />
        </div>
      </nav>

      <div className="app-container">
        <Routes>
          {/* Main site pages */}
          <Route path="/" element={<AboutPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* Fallback */}
          <Route path="*" element={<AboutPage />} />
        </Routes>
      </div>

      <RadioPlayer />

      <ScrollToTop />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
