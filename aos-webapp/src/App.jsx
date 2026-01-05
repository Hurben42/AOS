import React, { useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Category from "./pages/Category"; 
import FactionList from "./pages/FactionList";
import WarscrollDetail from "./pages/WarscrollDetail";
import FactionDetail from "./pages/FactionDetail";
import ImportList from "./pages/ImportList";
import SavedLists from "./pages/SavedLists";
import ListDetail from "./pages/ListDetail";
import MyListWarscroll from "./pages/MyListWarscroll";

// Pages Handbook
import Battleplans from "./pages/Battleplans"; 
import BattleTactics from "./pages/BattleTactics"; 

// Nouvelles Pages Game Mode
import StartGame from "./pages/StartGame";
import GameDashboard from "./pages/GameDashboard";

// --- COMPOSANT UTILITAIRE POUR LE SCROLL ---
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// --- NAVBAR (Logique de fermeture mobile intégrée) ---
function NavbarContent() {
  const location = useLocation();

  useEffect(() => {
    const menu = document.getElementById("navbarNav");
    if (menu && menu.classList.contains("show")) {
      // @ts-ignore
      const bsCollapse = window.bootstrap?.Collapse.getInstance(menu);
      if (bsCollapse) bsCollapse.hide();
    }
  }, [location]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary border-opacity-25 sticky-top shadow">
      <div className="container">
        <a className="navbar-brand fw-bold text-uppercase tracking-tighter" href="/">
          <span className="text-warning">AOS</span> V4 HELPER
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>
            <li className="nav-item"><a className="nav-link" href="/my-lists">Mes Listes</a></li>
            <li className="nav-item"><a className="nav-link text-warning" href="/start-game">Lancer une partie</a></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />

      <div className="bg-black text-light min-vh-100 pb-5">
        <NavbarContent />
        
        <div className="container mt-2">
          <Routes>
            {/* --- ACCUEIL ET OUTILS --- */}
            <Route path="/" element={<Home />} />
            <Route path="/import" element={<ImportList />} />
            <Route path="/my-lists" element={<SavedLists />} />
            <Route path="/my-lists/:id" element={<ListDetail />} />
            <Route path="/my-lists/:id/warscroll/:unitSlug" element={<MyListWarscroll />} />
            
            {/* --- GAME MODE ROUTES --- */}
            <Route path="/start-game" element={<StartGame />} />
            <Route path="/game/:gameId" element={<GameDashboard />} />
            
            {/* --- GENERAL'S HANDBOOK --- */}
            <Route path="/battleplans" element={<Battleplans />} />
            <Route path="/battletactics" element={<BattleTactics />} />
            
            {/* --- EXPLORATION FACTIONS --- */}
            <Route path="/category/:category/faction/:faction/section/:sectionSlug" element={<FactionDetail />} />
            <Route path="/category/:category/faction/:faction/warscroll/:warscrollSlug" element={<WarscrollDetail />} />
            <Route path="/category/:category/faction/:faction" element={<FactionList />} />
            <Route path="/category/:category" element={<Category />} /> 
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;