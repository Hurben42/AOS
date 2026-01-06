import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

// --- IMPORTS DES DONNÉES ---
import warscrollsData from "../data/warscrolls.json";
import spellsData from "../data/spellsIndex.json";
import manifestationsData from "../data/manifestationsIndex.json";
import battleTacticsData from "../data/battletactics.json";
import enhancementsData from "../data/enhancements_detailed.json";
import factionsFullData from "../data/factions_full_data.json";

// --- CONFIGURATION ---
const CATEGORY_BANNERS = {
  ORDER: "/factions/order/order.jpg",
  CHAOS: "/factions/chaos/chaos.jpg",
  DEATH: "/factions/death/death.jpg",
  DESTRUCTION: "/factions/destruction/destruction.jpg"
};

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);

  // Utilitaires de formatage
  const cleanForUrl = (n) => n.toLowerCase().trim().replace(/\s+/g, "-");
  const normalizeKey = (n) => n ? n.toLowerCase().replace(/[^a-z0-9]/g, "") : "";

  // --- MOTEUR DE RECHERCHE ---
  const allResults = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    if (s.length < 2) return [];

    let combined = [];
    
    // Mapping Faction -> Catégorie (Grand Alliance) via warscrolls.json
    const factionToCategory = {};
    Object.keys(warscrollsData).forEach(cat => {
      Object.keys(warscrollsData[cat]).forEach(fac => {
        factionToCategory[normalizeKey(fac)] = cat.toLowerCase();
      });
    });

    // 1. RECHERCHE UNITÉS (WARSCROLLS)
    Object.keys(warscrollsData).forEach(c => {
      Object.keys(warscrollsData[c]).forEach(f => {
        warscrollsData[c][f].forEach(u => {
          if (u.name.toLowerCase().includes(s)) {
            combined.push({ 
              name: u.name, type: "WARSCROLL", faction: f, color: "bg-danger",
              path: `/category/${c.toLowerCase()}/faction/${cleanForUrl(f)}/warscroll/${u.slug}` 
            });
          }
        });
      });
    });

    // 2. RECHERCHE AMÉLIORATIONS (Heroic Traits, Artefacts, Lores...)
    Object.keys(enhancementsData).forEach(fKey => {
      const factionContent = enhancementsData[fKey];
      const cat = factionToCategory[normalizeKey(fKey)] || "order";

      // CONFIGURATION SYNCHRONISÉE AVEC FactionDetail.jsx
      const mapping = [
        { jsonKey: 'heroic_traits', label: 'HEROIC TRAIT', route: 'heroic-traits' },
        { jsonKey: 'artefacts_of_power', label: 'ARTEFACT', route: 'artefacts-of-power' },
        { jsonKey: 'spell_lores', label: 'SPELL LORE', route: 'spell-lore' },
        { jsonKey: 'prayer_lores', label: 'PRAYER LORE', route: 'prayer-lore' }
      ];

      mapping.forEach(sec => {
        const list = factionContent[sec.jsonKey];
        if (list && Array.isArray(list)) {
          list.forEach(item => {
            if (item.name && item.name.toLowerCase().includes(s)) {
              combined.push({
                name: item.name,
                type: sec.label,
                faction: fKey.replace(/([A-Z])/g, ' $1').trim(), // Embellit le camelCase
                color: "bg-warning",
                path: `/category/${cat}/faction/${cleanForUrl(fKey)}/section/${sec.route}`
              });
            }
          });
        }
      });
    });

    // 3. RECHERCHE BATTLE TACTICS (Handbook)
    if (battleTacticsData) {
      battleTacticsData.forEach(bt => {
        if (bt.name.toLowerCase().includes(s)) {
          combined.push({
            name: bt.name, type: "BATTLE TACTIC", faction: "Handbook 2025", color: "bg-info",
            path: `/battletactics`
          });
        }
      });
    }

    return combined
      .filter((v, i, a) => a.findIndex(t => t.name === v.name && t.faction === v.faction) === i)
      .sort((a, b) => a.name.toLowerCase().startsWith(s) ? -1 : 1);
  }, [searchTerm]);

  const availableTypes = useMemo(() => [...new Set(allResults.map(r => r.type))], [allResults]);
  const filteredResults = useMemo(() => {
    const base = activeFilter ? allResults.filter(r => r.type === activeFilter) : allResults;
    return base.slice(0, 40);
  }, [allResults, activeFilter]);

  return (
    <div className="container mt-4 pb-5 px-3">
      {/* BARRE DE RECHERCHE DÉCLENCHEUR */}
      <div className="mb-4 pt-2">
        <div className="search-trigger-compact" onClick={() => setIsModalOpen(true)}>
          <div className="d-flex align-items-center">
            <span className="me-2">🔍</span>
            <span>Unité, artefact, trait héroïque...</span>
          </div>
          <span className="badge bg-dark border border-info text-info">SEARCH</span>
        </div>
      </div>

      <h1 className="text-white fw-bold mb-4 text-uppercase" style={{ letterSpacing: '3px', fontSize: '1.5rem' }}>Allégeances</h1>

      {/* GRILLE DES GRANDES ALLIANCES */}
      <div className="row g-3 mb-5">
        {Object.keys(warscrollsData).map((cat) => (
          <div key={cat} className="col-12 col-md-6">
            <Link to={`/category/${cat.toLowerCase()}`} className="card border-0 shadow-lg rounded-4 overflow-hidden position-relative category-card" style={{ height: '140px' }}>
              <div className="position-absolute w-100 h-100 banner-img" style={{ 
                backgroundImage: `url(${CATEGORY_BANNERS[cat.toUpperCase()]})`, 
                backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.5)' 
              }} />
              <div className="card-img-overlay d-flex flex-column align-items-center justify-content-center text-center">
                <h2 className="text-white fw-black text-uppercase m-0 shadow-text" style={{ fontSize: '1.8rem', zIndex: 1 }}>{cat}</h2>
                <span className="text-info small fw-bold text-uppercase mt-1" style={{ letterSpacing: '1px', zIndex: 1 }}>
                  Voir les {Object.keys(warscrollsData[cat]).length} armées →
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* SECTION GENERAL HANDBOOK */}
      <h2 className="text-white fw-bold mb-4 text-uppercase" style={{ letterSpacing: '3px', fontSize: '1.2rem' }}>General's Handbook</h2>
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-6">
          <Link to="/battleplans" className="text-decoration-none">
            <div className="card bg-dark text-white border-secondary shadow-lg overflow-hidden handbook-card rounded-4">
              <div className="handbook-banner" style={{ 
                backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('/battleplans/GeneralHandbook_files/generalhandbook.jpg')`,
                height: '120px', backgroundSize: 'cover', backgroundPosition: 'center' 
              }}>
                <div className="d-flex h-100 align-items-center justify-content-center flex-column">
                  <h3 className="fw-bold text-uppercase m-0 shadow-text fs-4">Battle Plans</h3>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6">
          <Link to="/battletactics" className="text-decoration-none">
            <div className="card bg-dark text-white border-secondary shadow-lg overflow-hidden handbook-card rounded-4">
              <div className="handbook-banner" style={{ 
                backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('/img/banner_seraphon.webp')`,
                height: '120px', backgroundSize: 'cover', backgroundPosition: 'center' 
              }}>
                <div className="d-flex h-100 align-items-center justify-content-center flex-column">
                  <h3 className="fw-bold text-uppercase m-0 shadow-text fs-4">Battle Tactics</h3>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* MODAL DE RECHERCHE PLEIN ÉCRAN */}
      {isModalOpen && (
        <div className="search-fullscreen-overlay">
          <div className="container h-100 d-flex flex-column pt-3">
            <div className="d-flex align-items-center mb-2 border-bottom border-secondary pb-2 px-2">
              <input autoFocus type="text" className="form-control bg-transparent border-0 text-white shadow-none fs-4" 
                placeholder="Chercher..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setActiveFilter(null);}} 
              />
              <button className="btn text-white fs-3" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            {availableTypes.length > 0 && (
              <div className="px-2 mb-3 d-flex flex-wrap gap-2">
                {availableTypes.map(type => (
                  <button key={type} onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                    className={`btn-filter-mini ${activeFilter === type ? 'active' : ''}`}>{type}</button>
                ))}
              </div>
            )}

            <div className="flex-grow-1 overflow-auto px-1 custom-scrollbar">
              <div className="row g-2 pb-5">
                {filteredResults.map((res, i) => (
                  <div key={i} className="col-12">
                    <Link to={res.path} className="search-item-compact" onClick={() => setIsModalOpen(false)}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center overflow-hidden">
                          <span className={`badge-mini ${res.color}`}>{res.type[0]}</span>
                          <div className="ms-3">
                            <div className="name-mini text-truncate">{res.name}</div>
                            <div className="faction-mini">{res.faction} • {res.type}</div>
                          </div>
                        </div>
                        <span className="text-secondary small">→</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .search-trigger-compact { background: #111; border: 1px solid #333; border-radius: 8px; padding: 12px 20px; color: #777; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .search-fullscreen-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #050505; z-index: 10000; }
        .search-item-compact { background: #111; border: 1px solid #222; border-radius: 6px; padding: 12px; display: block; text-decoration: none; transition: 0.2s; }
        .search-item-compact:hover { background: #1a1a1a; border-color: #444; }
        .btn-filter-mini { background: #1a1a1a; border: 1px solid #333; color: #888; font-size: 0.7rem; padding: 4px 12px; border-radius: 4px; border: 1px solid transparent; cursor: pointer; }
        .btn-filter-mini.active { background: #0dcaf0; color: #000; border-color: #0dcaf0; }
        .name-mini { color: #eee; font-weight: 600; font-size: 0.95rem; }
        .faction-mini { font-size: 0.75rem; color: #0dcaf0; text-transform: uppercase; margin-top: 2px; }
        .badge-mini { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 0.75rem; font-weight: 900; color: #000; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .category-card { border: 1px solid rgba(255,255,255,0.05) !important; transition: all 0.3s ease; }
        .category-card:hover { border-color: #ffc107 !important; transform: translateY(-3px); }
        .category-card:hover .banner-img { transform: scale(1.05); filter: brightness(0.7) !important; }
        .banner-img { transition: transform 0.6s ease, filter 0.3s ease; }
        .shadow-text { text-shadow: 2px 2px 10px rgba(0,0,0,1); }
        .fw-black { font-weight: 900; }
        .handbook-card { transition: all 0.3s ease; border: 1px solid #333 !important; }
        .handbook-card:hover { border-color: #ffc107 !important; }
      `}</style>
    </div>
  );
}