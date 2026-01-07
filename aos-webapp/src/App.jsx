import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter as Router, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom";

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
import HistoryPage from "./pages/HistoryPage";

// --- BANDEAU DE RECONNEXION PARTIE ---
function GameBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasActiveGame, setHasActiveGame] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("active_game_session");
    setHasActiveGame(!!session && !location.pathname.startsWith("/game"));
  }, [location]);

  if (!hasActiveGame) return null;

  return (
    <div 
      onClick={() => navigate("/game")}
      className="text-white text-center py-2 fw-bold shadow-lg animate__animated animate__slideInDown"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 3000, 
        cursor: "pointer",
        fontSize: "0.85rem",
        letterSpacing: "1px",
        textTransform: "uppercase",
        backgroundColor: "rgb(226, 119, 43)",
        borderBottom: "1px solid rgba(255,255,255,0.2)"
      }}
    >
      ⚡ Revenir à la partie en cours ⚡
    </div>
  );
}

// --- COMPOSANT UTILITAIRE POUR LE SCROLL ---
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// --- NAVBAR ---
function NavbarContent() {
  const location = useLocation();
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    setSessionActive(!!localStorage.getItem("active_game_session") && !location.pathname.startsWith("/game"));
    const menu = document.getElementById("navbarNav");
    if (menu && menu.classList.contains("show")) {
      const bsCollapse = window.bootstrap?.Collapse.getInstance(menu);
      if (bsCollapse) bsCollapse.hide();
    }
  }, [location]);

  return (
    <nav 
      className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary border-opacity-25 sticky-top shadow"
      style={{ marginTop: sessionActive ? '40px' : '0px', transition: 'margin-top 0.3s' }}
    >
      <div className="container">
        <Link className="navbar-brand fw-bold text-uppercase tracking-tighter" to="/">
          <span className="text-warning">AOS</span> V4 HELPER
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>
            <li className="nav-item">
              <Link className="nav-link" to="/my-lists">Mes Listes</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-warning" to="/start-game">Lancer une partie</Link>
            </li>
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
      <GameBanner />
      <div className="bg-black text-light min-vh-100 pb-5">
        <NavbarContent />
        <div className="container mt-2">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/import" element={<ImportList />} />
            <Route path="/my-lists" element={<SavedLists />} />
            <Route path="/my-lists/:id" element={<ListDetail />} />
            <Route path="/my-lists/:id/warscroll/:unitSlug" element={<MyListWarscroll />} />
            
            <Route path="/start-game" element={<StartGame />} />
            <Route path="/game" element={<GameDashboard />} />
            <Route path="/game/:gameId" element={<GameDashboard />} />
            <Route path="/history" element={<HistoryPage />} /> {/* <--- AJOUT ICI */}
            
            <Route path="/battleplans" element={<Battleplans />} />
            <Route path="/battletactics" element={<BattleTactics />} />
            
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