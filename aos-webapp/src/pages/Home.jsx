import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

// Import des données JSON
import warscrollsData from "../data/warscrolls.json";
import spellsData from "../data/spellsIndex.json";
import manifestationsData from "../data/manifestationsIndex.json";
import enhancementsData from "../data/enhancements_index.json";

const CATEGORY_BANNERS = {
  chaos: "banner_slaves.webp",
  death: "banner_flesheater.webp",
  destruction: "banner_ironjawz.webp",
  order: "banner_stormcast.webp",
};

export default function Home() {
  const [openCategories, setOpenCategories] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);

  // CORRECTION : On utilise des tirets pour des URLs propres
  const cleanForUrl = (n) => n.toLowerCase().trim().replace(/\s+/g, "-");

  // --- MOTEUR DE RECHERCHE ---
  const allResults = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    if (s.length < 2) return [];

    let combined = [];

    const factionToCategory = {};
    Object.keys(warscrollsData).forEach(cat => {
      Object.keys(warscrollsData[cat]).forEach(fac => {
        factionToCategory[fac] = cat.toLowerCase();
      });
    });

    // 1. WARSCROLLS
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

    // 2. SPELLS & PRAYERS
    if (spellsData.factions) {
      Object.keys(spellsData.factions).forEach(f => {
        const cat = factionToCategory[f] || "order";
        Object.keys(spellsData.factions[f]).forEach(lore => {
          spellsData.factions[f][lore].forEach(spell => {
            if (spell.name.toLowerCase().includes(s)) {
              combined.push({ 
                name: spell.name, type: "SPELL/PRAYER", faction: f, color: "bg-success",
                path: `/category/${cat}/faction/${cleanForUrl(f)}/section/spell-lore` 
              });
            }
          });
        });
      });
    }

    // 3. MANIFESTATIONS
    if (manifestationsData.factions) {
      Object.keys(manifestationsData.factions).forEach(f => {
        const cat = factionToCategory[f] || "order";
        manifestationsData.factions[f].forEach(m => {
          if (m.name.toLowerCase().includes(s)) {
            const unitSlug = m.name.toLowerCase().replace(/\s+/g, "-");
            const hasWarscroll = warscrollsData[cat]?.[f]?.some(u => u.slug === unitSlug);

            combined.push({ 
              name: m.name, type: "MANIFESTATION", faction: f, color: "bg-success",
              path: hasWarscroll 
                ? `/category/${cat}/faction/${cleanForUrl(f)}/warscroll/${unitSlug}`
                : `/category/${cat}/faction/${cleanForUrl(f)}/section/manifestations`
            });
          }
        });
      });
    }

    // 4. ENHANCEMENTS
    Object.keys(enhancementsData).forEach(f => {
      const cat = factionToCategory[f] || "order";
      enhancementsData[f].all_enhancements.forEach(enh => {
        if (enh.toLowerCase().includes(s)) {
          combined.push({ 
            name: enh, type: "ENHANCEMENT", faction: f, color: "bg-warning",
            path: `/category/${cat}/faction/${cleanForUrl(f)}/section/battle-traits` 
          });
        }
      });
    });

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
    <div className="container mt-4 pb-5">
      <div className="mb-4 pt-2">
        <div className="search-trigger-compact" onClick={() => setIsModalOpen(true)}>
          <div className="d-flex align-items-center">
            <span className="me-2">🔍</span>
            <span>Rechercher...</span>
          </div>
          <span className="badge bg-dark border border-info text-info">SEARCH</span>
        </div>
      </div>

      <h1 className="text-center mb-4 fw-bold text-uppercase" style={{letterSpacing: '2px'}}>Factions</h1>

      {Object.keys(warscrollsData).map((category) => (
        <div key={category} className="mb-3">
          <button 
            className="btn btn-dark w-100 p-0 overflow-hidden border-secondary shadow-sm" 
            onClick={() => setOpenCategories(p => ({...p, [category]: !p[category]}))}
          >
            {CATEGORY_BANNERS[category.toLowerCase()] && (
              <img src={`/img/${CATEGORY_BANNERS[category.toLowerCase()]}`} className="w-100" style={{ maxHeight: "80px", objectFit: "cover", opacity: 0.5 }} />
            )}
            <div className="p-1 fw-bold text-uppercase small" style={{background: 'rgba(0,0,0,0.4)'}}>{category}</div>
          </button>
          <div className={`collapse ${openCategories[category] ? "show" : ""}`}>
            <div className="list-group mt-1">
              {Object.keys(warscrollsData[category]).map(f => (
                <Link key={f} to={`/category/${category.toLowerCase()}/faction/${cleanForUrl(f)}`} className="list-group-item list-group-item-action bg-black text-white-50 border-secondary py-2 small">
                  {f}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* MODAL DE RECHERCHE */}
      {isModalOpen && (
        <div className="search-fullscreen-overlay">
          <div className="container h-100 d-flex flex-column pt-3">
            <div className="d-flex align-items-center mb-2 border-bottom border-secondary pb-2 px-2">
              <input 
                autoFocus 
                type="text" 
                className="form-control bg-transparent border-0 text-white shadow-none fs-4" 
                placeholder="Tapez pour chercher..." 
                value={searchTerm} 
                onChange={e => {setSearchTerm(e.target.value); setActiveFilter(null);}} 
              />
              <button className="btn text-white fs-3" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            {availableTypes.length > 0 && (
              <div className="px-2 mb-3 d-flex align-items-center flex-wrap" style={{gap: '8px'}}>
                <span className="text-secondary small fw-bold text-uppercase me-1" style={{fontSize: '0.6rem'}}>Filtrer :</span>
                {availableTypes.map(type => (
                  <button 
                    key={type} 
                    onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                    className={`btn-filter-mini ${activeFilter === type ? 'active' : ''}`}
                  >
                    {type}
                  </button>
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
                          <div className="ms-2">
                            <div className="name-mini text-truncate">{res.name}</div>
                            <div className="faction-mini">{res.faction} • <span className="text-secondary" style={{fontSize: '0.6rem'}}>{res.type}</span></div>
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
        .form-control::placeholder { color: #bbbbbb !important; opacity: 1; }
        .search-item-compact { background: #111; border: 1px solid #222; border-radius: 6px; padding: 8px 12px; display: block; text-decoration: none; }
        .btn-filter-mini { background: #1a1a1a; border: 1px solid #333; color: #888; font-size: 0.65rem; font-weight: bold; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; transition: 0.2s; }
        .btn-filter-mini.active { background: #0dcaf0; border-color: #0dcaf0; color: #000; }
        .name-mini { color: #eee; font-weight: 600; font-size: 0.9rem; line-height: 1.1; }
        .faction-mini { font-size: 0.7rem; color: #0dcaf0; text-transform: uppercase; margin-top: 1px; font-weight: 500; }
        .badge-mini { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 3px; font-size: 0.65rem; font-weight: 900; color: #000; flex-shrink: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}