import React from "react";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";

import HomePage from "./Pages/HomePage/HomePage";
import PortfolioPage from "./Pages/PortfolioPage/PortfolioPage";
import ContactPage from "./Pages/ContactPage/ContactPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="max-w-4xl mx-auto p-8">

        {/* Navbar */}
        <nav className="flex justify-center space-x-6 mb-12 text-lg font-medium">
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
          <Link to="/portfolio" className="text-blue-600 hover:underline">Portfolio</Link>
          <Link to="/contact" className="text-blue-600 hover:underline">Contact</Link>
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
};

export default App;
