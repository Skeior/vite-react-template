import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ReactAudioPlayer from "react-audio-player";
import ScrollToTop from "./Components/ScrollToTop";
import AboutPage from "./Pages/AboutPage/About";
import PortfolioPage from "./Pages/PortfolioPage/PortfolioPage";
import ContactPage from "./Pages/ContactPage/ContactPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper" style={{ position: "relative", minHeight: "100vh" }}>
        <div className="app-container" style={{ position: "relative", zIndex: 1 }}>
          {/* Navbar */}
          <nav className="navbar" style={{ position: "relative", zIndex: 10 }}>
            <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Home
            </NavLink>
            <NavLink to="/portfolio" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Portfolio
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Contact
            </NavLink>

            <div className="audio-player-wrapper">
              <ReactAudioPlayer
                id="audio-player"
                src="https://alemfm.radyotvonline.net/alemfmaac?/;stream.mp3"
                volume={0.3}
                controls
              />

            </div>
          </nav>

          {/* Routes */}
          <Routes>
            <Route path="/" element={<AboutPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>

          {/* Scroll to Top Button */}
          <ScrollToTop />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
