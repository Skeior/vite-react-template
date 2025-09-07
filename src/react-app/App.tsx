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
      <div className="app-wrapper">
        {/* Navbar */}
        <nav className="navbar">
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
            <NavLink to="/portfolio" className={({ isActive }) => (isActive ? "active" : "")}>Portfolio</NavLink>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>Contact</NavLink>
          </div>

          <div className="audio-player-wrapper">
            <ReactAudioPlayer
              src="https://alemfm.radyotvonline.net/alemfmaac?/;stream.mp3"
              volume={0.3}
              controls
            />
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
