import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import manifestationsDetailed from "../data/manifestations_detailed.json";
import spellsIndex from "../data/spellsIndex.json";
import confetti from "canvas-confetti";

export default function ListDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [activeSpells, setActiveSpells] = useState([]);
  const [activeManifestations, setActiveManifestations] = useState([]);
  const [battleTactics, setBattleTactics] = useState([]);
  const [viewMode, setViewMode] = useState("regiments");
  const [uniqueUnits, setUniqueUnits] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);

  const factionDataKeyMap = {
    "soulblight gravelords": "soulblight", "ossiarch bonereapers": "ossiarch",
    "nighthaunt": "nighthaunt", "skaven": "skaven", "stormcast eternals": "stormcast",
    "flesh-eater courts": "flesheater", "nurgle": "nurgle", "ironjawz": "ironjawz",
    "gloomspite gitz": "gloomspite", "kruleboyz": "kruleboyz"
  };

  const triggerExplosion = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 3000 };

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: 0.2, y: 0.5 }, colors: ['#0dcaf0', '#ffc107'] });
      confetti({ ...defaults, particleCount, origin: { x: 0.8, y: 0.5 }, colors: ['#0dcaf0', '#ffffff'] });
    }, 250);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const importData = params.get("data");

    let currentList = null;

    // GESTION DE L'IMPORT QR (Utilisateur A reçoit de Utilisateur B)
    if (id === "import" && importData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(importData));
        const newList = { ...decodedData, id: Date.now().toString() };
        
        const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
        localStorage.setItem("warhammer_saved_lists", JSON.stringify([newList, ...saved]));
        
        currentList = newList;
        setShowImportModal(true);
        triggerExplosion();
        
        navigate(`/my-lists/${newList.id}`, { replace: true });
      } catch (e) {
        console.error("Erreur d'importation", e);
      }
    } else {
      const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
      currentList = saved.find(l => l.id === id);
    }

    if (currentList) {
      setList(currentList);
      const factionLower = currentList.faction.toLowerCase();
      const dataKey = Object.keys(factionDataKeyMap).find(k => factionLower.includes(k)) 
                      ? factionDataKeyMap[Object.keys(factionDataKeyMap).find(k => factionLower.includes(k))] 
                      : "slaves";

      const uMap = new Map();
      currentList.regiments.forEach(r => {
        if (r.hero) uMap.set(r.hero, "HERO");
        r.units.forEach(u => uMap.set(u.name, u.type || "UNIT"));
      });
      setUniqueUnits(Array.from(uMap.entries()).map(([name, type]) => ({ name, type })));

      const loreSpells = spellsIndex.factions?.[dataKey] || {};
      const loreKey = Object.keys(loreSpells).find(k => k.toLowerCase() === currentList.spellLore?.toLowerCase());
      if (loreKey) setActiveSpells(loreSpells[loreKey]);

      const mNames = manifestationsDetailed.generics?.[currentList.manifestationLore] || [];
      const mDetailed = manifestationsDetailed.factions?.[dataKey] || [];
      setActiveManifestations(mNames.map(n => ({
        name: n, castingValue: mDetailed.find(x => x.name === n)?.castingValue || "7",
      })));

      setBattleTactics(currentList.battletactics || []);
    }
  }, [id, location, navigate]);

  if (!list) return <div className="p-5 text-white">Chargement du briefing...</div>;

  const formatSlug = (n) => n.toLowerCase().replace(/ /g, "-").replace(/['’]/g, "").replace(/,/g, "");
  const banner = `/img/banner_${list.faction.toLowerCase().replace(/\s+/g, '')}.webp`;

  return (
    <div className="min-h-screen bg-black pb-5 font-monospace text-start position-relative">
      <div className={showImportModal ? "opacity-25 blur-sm transition-all" : ""}>
        
        {/* HEADER : BANNIÈRE DYNAMIQUE */}
        <div className="w-100 position-relative" style={{ height: '280px', backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '2px solid #0dcaf0' }}>
            <div className="position-absolute w-100 h-100" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }}></div>
            <div className="position-absolute bottom-0 p-4 w-100 container">
                <h1 className="fw-900 text-uppercase text-white mb-0 shadow-text" style={{fontSize: '3.5rem'}}>{list.faction}</h1>
                <div className="d-flex gap-2 mt-2">
                    <span className="badge bg-info text-black rounded-0 fw-bold">{list.subFaction}</span>
                    <span className="badge bg-dark border border-secondary rounded-0">{list.points} PTS</span>
                </div>
            </div>
        </div>

        <div className="container mt-4">
            {/* NAVIGATION MODE VUE */}
            <div className="d-flex bg-dark p-1 mb-4 border border-secondary border-opacity-25" style={{maxWidth: '400px'}}>
                <button onClick={() => setViewMode("regiments")} className={`flex-grow-1 btn btn-sm rounded-0 fw-bold transition ${viewMode === 'regiments' ? 'btn-info text-black' : 'text-secondary hover-white'}`}>[ RÉGIMENTS ]</button>
                <button onClick={() => setViewMode("units")} className={`flex-grow-1 btn btn-sm rounded-0 fw-bold transition ${viewMode === 'units' ? 'btn-info text-black' : 'text-secondary hover-white'}`}>[ UNITÉS ]</button>
            </div>

            <div className="row g-4">
                {/* COLONNE GAUCHE : COMPOSITION */}
                <div className="col-lg-8">
                    {viewMode === "regiments" ? (
                        list.regiments.map((reg, idx) => (
                            <div key={idx} className="mb-4 bg-dark bg-opacity-40 border border-secondary border-opacity-25 shadow-lg">
                                <div className="p-2 px-3 bg-secondary bg-opacity-10 border-bottom border-secondary border-opacity-25 text-info fw-bold small uppercase">
                                    {reg.isGeneral ? "★ Régiment du Général" : `Régiment #${idx + 1}`}
                                </div>
                                <div className="p-3">
                                    {reg.hero && (
                                        <div className="mb-3 d-flex align-items-center gap-3">
                                            <div className="bg-info text-black fw-900 d-flex align-items-center justify-content-center" style={{width: '35px', height: '35px'}}>H</div>
                                            <div>
                                                <Link to={`/my-lists/${list.id}/warscroll/${formatSlug(reg.hero)}`} className="text-white fw-bold text-decoration-none text-uppercase hover-info">{reg.hero}</Link>
                                                <div className="text-info tiny fw-bold opacity-75">{reg.heroOptions?.join(" • ")}</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="ps-4 border-start border-secondary border-opacity-25 ms-3">
                                        {reg.units.map((u, ui) => (
                                            <div key={ui} className="mb-2 d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-10 pb-1">
                                                <Link to={`/my-lists/${list.id}/warscroll/${formatSlug(u.name)}`} className="text-secondary hover-white small fw-bold text-decoration-none">
                                                    • {u.name}
                                                </Link>
                                                {u.reinforced && <span className="badge border border-warning text-warning tiny rounded-0">REINFORCED</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="row g-2">
                            {uniqueUnits.map((u, i) => (
                                <div key={i} className="col-md-6">
                                    <Link to={`/my-lists/${list.id}/warscroll/${formatSlug(u.name)}`} className="text-decoration-none">
                                        <div className="bg-dark bg-opacity-40 border border-secondary border-opacity-25 p-3 d-flex align-items-center gap-3 hover-info transition">
                                            <div className={`fw-900 d-flex align-items-center justify-content-center ${u.type === 'HERO' ? 'bg-info text-black' : 'bg-secondary text-white'}`} style={{width: '35px', height: '35px'}}>{u.type[0]}</div>
                                            <span className="text-white fw-bold text-uppercase small">{u.name}</span>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* COLONNE DROITE : TACTIQUES & LORE */}
                <div className="col-lg-4">
                    {/* BATTLE TACTICS */}
                    <div className="bg-dark bg-opacity-30 border border-danger border-opacity-25 p-4 shadow-lg text-white mb-4">
                        <h6 className="text-danger fw-bold text-uppercase border-bottom border-danger border-opacity-50 pb-2 mb-3 small">Battle Tactics</h6>
                        {battleTactics.length > 0 ? battleTactics.map((t, i) => (
                            <div key={i} className="d-flex align-items-start gap-3 mb-3 p-2 border border-secondary border-opacity-10 hover-tactic transition cursor-pointer" onClick={e => e.currentTarget.classList.toggle('tactic-checked')}>
                                <div className="tactic-checkbox mt-1"></div>
                                <div className="tiny fw-bold uppercase text-white opacity-75">{t}</div>
                            </div>
                        )) : <div className="tiny text-secondary">Aucune tactique détectée</div>}
                    </div>

                    {/* ARMY LORE (Sorts & Prières) */}
                    <div className="bg-dark bg-opacity-30 border border-success border-opacity-25 p-4 shadow-lg text-white mb-4">
                        <h6 className="text-success fw-bold text-uppercase border-bottom border-success border-opacity-50 pb-2 mb-3 small">Appuis Tactiques</h6>
                        <div className="mb-3">
                            <div className="text-success tiny uppercase fw-bold mb-1">Spell Lore</div>
                            <div className="p-2 border border-secondary border-opacity-20 small">{list.spellLore || "Non défini"}</div>
                        </div>
                        <div className="mb-3">
                            <div className="text-success tiny uppercase fw-bold mb-1">Prayer Lore</div>
                            <div className="p-2 border border-secondary border-opacity-20 small">{list.prayerLore || "Non défini"}</div>
                        </div>
                        <div>
                            <div className="text-success tiny uppercase fw-bold mb-1">Manifestations</div>
                            <div className="p-2 border border-secondary border-opacity-20">
                                <div className="small fw-bold mb-1 uppercase">{list.manifestationLore}</div>
                                {activeManifestations.map((m, i) => (
                                    <div key={i} className="text-white-50 tiny mt-1 d-flex justify-content-between">
                                        <span>• {m.name}</span>
                                        <span className="text-success fw-bold">{m.castingValue}+</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FACTION TERRAIN (BLOC INDÉPENDANT) */}
                    <div className="bg-dark bg-opacity-30 border border-warning border-opacity-25 p-4 shadow-lg text-white">
                        <h6 className="text-warning fw-bold text-uppercase border-bottom border-warning border-opacity-50 pb-2 mb-3 small">Faction Terrain</h6>
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-warning text-black p-2 rounded-2">
                                <i className="bi bi-geo-fill"></i>
                            </div>
                            <div className="small fw-900 uppercase">
                                {list.factionTerrain || "Non Déployé"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* MODAL DE SUCCÈS (SCAN QR) */}
      {showImportModal && (
        <div className="modal-overlay d-flex align-items-center justify-content-center p-3" style={{zIndex: 2000}}>
          <div className="modal-content bg-dark text-center shadow-2xl border-0 overflow-hidden animate__animated animate__backInDown" 
               style={{ maxWidth: '400px', borderRadius: '30px', backgroundColor: '#121417', border: '1px solid rgba(13, 202, 240, 0.3)' }}>
            
            <div className="position-relative" style={{ height: '140px' }}>
                <div className="w-100 h-100" style={{ backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to bottom, rgba(18,20,23,0.2), #121417)' }}></div>
                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2 w-100 text-center">
                    <div className="scanner-line"></div>
                    <span className="badge bg-warning text-black fw-900 uppercase py-1 px-3 mb-2" style={{ fontSize: '0.65rem', borderRadius: '50px' }}>LIAISON ÉTABLIE</span>
                    <h3 className="text-white fw-900 uppercase m-0" style={{letterSpacing: '2px'}}>RENFORT ARRIVÉ</h3>
                </div>
            </div>

            <div className="p-4 pt-2">
              <i className="bi bi-shield-check display-4 text-info my-4 d-block animate__animated animate__pulse animate__infinite"></i>
              <h5 className="text-white fw-bold uppercase mb-1">{list.faction}</h5>
              <p className="text-white-50 small mb-4 px-3">Les coordonnées tactiques ont été synchronisées avec succès. Déploiement en cours.</p>
              <button className="btn btn-info w-100 py-3 rounded-pill fw-900 text-uppercase shadow-info transition" onClick={() => setShowImportModal(false)}>
                CONSULTER LE BRIEFING
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fw-900 { font-weight: 900; } 
        .tiny { font-size: 0.65rem; } 
        .uppercase { text-transform: uppercase; }
        .transition { transition: all 0.2s ease; }
        .hover-info:hover { color: #0dcaf0 !important; cursor: pointer; }
        .tactic-checkbox { width: 14px; height: 14px; border: 1px solid #ff0739; flex-shrink: 0; }
        .tactic-checked .tactic-checkbox { background-color: #ff0739; box-shadow: 0 0 8px #ff0739; }
        .tactic-checked .tiny { color: #ff0739 !important; text-decoration: line-through; opacity: 0.4; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); }
        .scanner-line { position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: #0dcaf0; box-shadow: 0 0 15px #0dcaf0; animation: scanMove 2s infinite linear; }
        @keyframes scanMove { 0% { transform: translateY(-100px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } }
        .shadow-info { box-shadow: 0 4px 20px rgba(13, 202, 240, 0.4); }
        .blur-sm { filter: blur(4px); transition: filter 0.3s; }
        .shadow-text { text-shadow: 2px 2px 10px rgba(0,0,0,0.9); }
      `}</style>
    </div>
  );
}