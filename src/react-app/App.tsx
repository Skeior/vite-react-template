
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import HomePage from "./Pages/HomePage/HomePage";
import PortfolioPage from "./Pages/PortfolioPage/PortfolioPage";
import ContactPage from "./Pages/ContactPage/ContactPage";
import ReactAudioPlayer from 'react-audio-player';

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Navbar */}
        <nav className="navbar">
          <Link to="/">Hakkımda</Link>
          <Link to="/portfolio">Portfolyo</Link>
          <Link to="/contact">İletişim</Link>

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
          <Route path="/" element={<HomePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
