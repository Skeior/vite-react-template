// App.tsx
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ReactAudioPlayer from 'react-audio-player';

import AboutPage from "./Pages/AboutPage/About";
import PortfolioPage from "./Pages/PortfolioPage/PortfolioPage";
import ContactPage from "./Pages/ContactPage/ContactPage";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Navbar */}
        <nav className="navbar">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Hakkımda
          </NavLink>
          <NavLink 
            to="/portfolio" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Portfolyo
          </NavLink>
          <NavLink 
            to="/contact" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            İletişim
          </NavLink>

          <div className="audio-player-wrapper">
            <ReactAudioPlayer
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
      </div>
    </BrowserRouter>
  );
}

export default App;
