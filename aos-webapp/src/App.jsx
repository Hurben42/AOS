import React, { useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Category from "./pages/Category"; // <--- AJOUTE CETTE LIGNE ABSOLUMENT
import FactionList from "./pages/FactionList";
import WarscrollList from "./pages/WarscrollList";
import WarscrollDetail from "./pages/WarscrollDetail";
import FactionDetail from "./pages/FactionDetail";
import ImportList from "./pages/ImportList";
import SavedLists from "./pages/SavedLists";
import ListDetail from "./pages/ListDetail";
import MyListWarscroll from "./pages/MyListWarscroll";

function NavbarContent() {
  const location = useLocation();
  useEffect(() => {
    const menu = document.getElementById("navbarNav");
    if (menu && menu.classList.contains("show")) {
      const bsCollapse = window.bootstrap?.Collapse.getInstance(menu);
      if (bsCollapse) bsCollapse.hide();
      else menu.classList.remove("show");
    }
  }, [location]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm mb-4 sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">AoS Webapp</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item"><Link className="nav-link" to="/">Accueil</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/my-lists">Mes Listes</Link></li>
            <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
              <Link className="btn btn-outline-primary btn-sm px-3" to="/import">📋 Importer une liste</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <NavbarContent />
      <div className="container mt-2">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/import" element={<ImportList />} />
          <Route path="/my-lists" element={<SavedLists />} />
          <Route path="/my-lists/:id" element={<ListDetail />} />
          <Route path="/my-lists/:id/warscroll/:unitSlug" element={<MyListWarscroll />} />
          
          {/* Les routes les plus précises en premier */}
          <Route path="/category/:category/faction/:faction/section/:sectionSlug" element={<FactionDetail />} />
          <Route path="/category/:category/faction/:faction/warscroll/:warscrollSlug" element={<WarscrollDetail />} />
          <Route path="/category/:category/faction/:faction" element={<FactionList />} />
          
          {/* La route la moins précise à la fin du bloc category */}
          <Route path="/category/:category" element={<Category />} /> 
        </Routes>
      </div>
    </Router>
  );
}