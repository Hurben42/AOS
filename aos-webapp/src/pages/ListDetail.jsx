import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";
import manifestationsIndex from "../data/manifestationsIndex.json";
import spellsIndex from "../data/spellsIndex.json";
import factionTerrainIndex from "../data/factionTerrainIndex.json";
import battleTacticsData from "../data/battletactics.json";

export default function ListDetail() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [uniqueUnits, setUniqueUnits] = useState([]);
  const [factionManifestations, setFactionManifestations] = useState([]);
  const [factionTerrainWS, setFactionTerrainWS] = useState(null);
  const [activeSpellLore, setActiveSpellLore] = useState([]);
  const [viewMode, setViewMode] = useState("regiments");

  const bannerMapping = {
    "Helsmiths": "helsmiths", "Ossiarch Bonereapers": "ossiarch", "Soulblight Gravelords": "soulblight",
    "Nighthaunt": "nighthaunt", "Flesh-eater Courts": "flesheater", "Sons of Behemat": "sonsofbehemat",
    "Idoneth Deepkin": "idoneth", "Blades of Khorne": "khorne", "Sylvaneth": "sylvaneth",
    "Disciples of Tzeentch": "tzeentch", "Ironjawz": "ironjawz", "Gloomspite Gitz": "gloomspite",
    "Slaves to Darkness": "slaves", "Lumineth Realm-lords": "lumineth", "Hedonites of Slaanesh": "slaanesh",
    "Skaven": "skaven", "Daughters of Khaine": "daughtersofkhaine", "Kruleboyz": "kruleboyz",
    "Kharadron Overlords": "kharadron", "Cities of Sigmar": "citiesofsigmar", "Fyreslayers": "fyreslayers",
    "Seraphon": "seraphon", "Stormcast Eternals": "stormcast", "Maggotkin of Nurgle": "nurgle", "Ogor Mawtribes": "ogor"
  };

  // LOGIQUE DE TRAITEMENT DES DONNÉES CONSERVÉE
  const normalize = (str) => 
    str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim() || "";

  const getKeywordsFromWS = (html) => {
    if (!html) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const keywordElement = doc.querySelector(".wsKeywordLine1");
    if (!keywordElement) return [];
    return keywordElement.textContent.replace(/(KEYWORDS|MOTS-CLÉS)\s*:/i, "").toUpperCase().split(/[,•]/).map(k => k.trim()).filter(k => k !== "");
  };

  const getUnitData = (rawName, allWarscrolls) => {
    if (!rawName || rawName.trim().startsWith('•')) return null;
    let cleanName = rawName.replace(/\s\(\d+.*pts\)$/i, "").replace(/\s\(\d+\)$/i, "").trim();
    const norm = normalize(cleanName);
    const match = allWarscrolls.find(ws => normalize(ws.name) === norm || normalize(ws.slug) === norm);
    
    return {
      displayName: match ? match.name : cleanName,
      keywords: match ? getKeywordsFromWS(match.html) : [],
      slug: match ? formatSlug(match.name) : formatSlug(cleanName)
    };
  };

  useEffect(() => {
    const savedRaw = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    const found = savedRaw.find(l => l.id?.toString() === id?.toString());
    
    if (found) {
      setList(found);
      const data = found.listData || found; 
      const allWarscrolls = Object.values(warscrollsData).flatMap(cat => Object.values(cat).flatMap(f => f));

      const cleanFactionKey = bannerMapping[data.faction] || normalize(data.faction);
      const factionSpells = spellsIndex.factions[cleanFactionKey] || {};
      const loreName = data.spellLore;
      const matchedLore = Object.keys(factionSpells).find(l => normalize(l) === normalize(loreName));
      if (matchedLore) setActiveSpellLore(factionSpells[matchedLore]);

      const terrainInfo = factionTerrainIndex[cleanFactionKey];
      if (terrainInfo) {
        const terrainWS = allWarscrolls.find(ws => normalize(ws.name) === normalize(terrainInfo.name));
        if (terrainWS) setFactionTerrainWS(terrainWS);
      }

      const manifestationLoreName = data.manifestationLore;
      const mfs = [];
      const seenMfs = new Set();
      const allowedGenericNames = (manifestationsIndex.generics[manifestationLoreName] || []).map(n => normalize(n));
      const factionMfsData = manifestationsIndex.factions[cleanFactionKey] || [];
      const allowedFactionNames = factionMfsData.map(m => normalize(m.name));

      allWarscrolls.forEach(ws => {
        const normWSName = normalize(ws.name);
        if (getKeywordsFromWS(ws.html).includes("MANIFESTATION")) {
          if ((allowedGenericNames.includes(normWSName) || allowedFactionNames.includes(normWSName)) && !seenMfs.has(normWSName)) {
            seenMfs.add(normWSName);
            const cvMatch = [...factionMfsData, ...(manifestationsIndex.warscrolls || [])].find(m => normalize(m.name) === normWSName);
            mfs.push({ ...ws, displayCV: cvMatch ? cvMatch.castingValue : "7" });
          }
        }
      });
      setFactionManifestations(mfs);

      const regs = data.regiments || [];
      const compiledUnits = new Map();
      regs.forEach(reg => {
        const items = [reg.hero, ...(reg.units || [])].filter(Boolean);
        items.forEach(item => {
          const uInfo = getUnitData(item.name || item.unitName || item, allWarscrolls);
          if (uInfo && !compiledUnits.has(normalize(uInfo.displayName))) {
            compiledUnits.set(normalize(uInfo.displayName), uInfo);
          }
        });
      });
      setUniqueUnits(Array.from(compiledUnits.values()).sort((a,b) => a.displayName.localeCompare(b.displayName)));
    }
  }, [id]);

  const detectedTactics = useMemo(() => {
    if (!list || !battleTacticsData) return [];
    const data = list.listData || list;
    const savedTacticIdentifiers = data.battle_tactics || [];
    return battleTacticsData.filter(bt => savedTacticIdentifiers.some(identifier => normalize(bt.id) === normalize(identifier) || normalize(bt.name) === normalize(identifier)));
  }, [list]);

  const formatSlug = (name) => name.toLowerCase().replace(/['’]/g, '-').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  
  const getBadgeColor = (k) => {
    if (k.includes("HERO")) return "bg-warning text-dark fw-bold";
    if (k.includes("WIZARD")) return "bg-primary text-white";
    if (k.includes("MONSTER")) return "bg-danger text-white";
    return "bg-dark text-white-50 border border-secondary border-opacity-50";
  };

  if (!list) return <div className="container mt-5 text-center text-white font-monospace"><div className="spinner-border text-info mb-3"></div><p>SYNCHRONISATION...</p></div>;

  const displayData = list.listData || list;
  const allWarscrolls = Object.values(warscrollsData).flatMap(cat => Object.values(cat).flatMap(f => f));
  const banner = bannerMapping[displayData.faction] || "default";

  return (
    <div className="container mt-4 pb-5 px-3 font-monospace">
      {/* HEADER STYLE COMMAND TABLET */}
      <div className="data-card mb-4 shadow-lg border-info border-opacity-25" style={{ height: 'auto', minHeight: '120px' }}>
        <div className="card-points-sidebar">
          <div className="points-label">TOTAL</div>
          <div className="points-val">{displayData.points || "0"}</div>
          <div className="points-label mt-1">PTS</div>
        </div>

        <div className="card-main">
          <div className="card-image-bg" style={{ backgroundImage: `url(/img/banner_${banner}.webp)`, opacity: '0.4' }}></div>
          <div className="card-content-overlay py-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="faction-pill">{displayData.faction}</span>
                <h3 className="army-name-display text-uppercase mt-2 mb-1 shadow-text">{list.title || displayData.customTitle}</h3>
                <div className="bottom-meta">
                  <span className="text-info">SUBFACTION:</span> {displayData.subFaction}
                </div>
              </div>
              <Link to="/my-lists" className="dock-btn text-decoration-none">
                <i className="bi bi-arrow-left me-1"></i> BACK
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTEUR DE VUE STYLE TERMINAL */}
      <div className="d-flex gap-2 mb-4">
        <button 
          className={`flex-fill btn btn-sm rounded-0 fw-bold text-uppercase ${viewMode === 'regiments' ? 'btn-info text-black' : 'btn-outline-secondary text-white'}`}
          onClick={() => setViewMode("regiments")}
        >
          [ Vue Régiments ]
        </button>
        <button 
          className={`flex-fill btn btn-sm rounded-0 fw-bold text-uppercase ${viewMode === 'compiled' ? 'btn-info text-black' : 'btn-outline-secondary text-white'}`}
          onClick={() => setViewMode("compiled")}
        >
          [ Vue Compilée ]
        </button>
      </div>

      {/* UNITÉS DE GUERRE */}
      <div className="row g-3">
        {viewMode === "regiments" ? (
          (displayData.regiments || []).map((reg, rIdx) => (
            <div key={rIdx} className="col-12">
              <div className="bg-black border border-secondary border-opacity-25 p-3 position-relative">
                <div className="position-absolute top-0 start-0 bg-white text-black px-2 fw-bold" style={{ fontSize: '0.6rem' }}>
                  REGIMENT #{rIdx + 1} {rIdx === 0 ? "— GÉNÉRAL" : ""}
                </div>
                <div className="mt-2">
                  {[reg.hero, ...(reg.units || [])].filter(Boolean).map((u, uIdx) => {
                    const uInfo = getUnitData(u.name || u.unitName || u, allWarscrolls);
                    if (!uInfo) return null;
                    return (
                      <div key={uIdx} className="d-flex flex-column py-2 border-bottom border-secondary border-opacity-10 position-relative">
                        <Link className="text-decoration-none text-white d-flex justify-content-between align-items-center" to={`/my-lists/${list.id}/warscroll/${uInfo.slug}`}>
                          <span className={`fw-bold text-uppercase ${uIdx === 0 ? 'text-info' : ''}`} style={{ fontSize: '0.85rem' }}>
                             {uIdx === 0 ? <i className="bi bi-star-fill me-2" style={{fontSize: '0.7rem'}}></i> : "-- "}{uInfo.displayName}
                          </span>
                          <i className="bi bi-chevron-right text-secondary" style={{fontSize: '0.7rem'}}></i>
                        </Link>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {uIdx === 0 && <span className="badge bg-warning text-dark fw-bold" style={{fontSize: '0.45rem'}}>HERO</span>}
                          {uInfo.keywords.map((k, i) => (
                            <span key={i} className={`badge ${getBadgeColor(k)}`} style={{ fontSize: '0.45rem' }}>{k}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          uniqueUnits.map((unit, idx) => (
            <div key={idx} className="col-12 col-md-6">
              <div className="bg-black border border-secondary border-opacity-25 p-3">
                <Link className="text-decoration-none text-white d-flex justify-content-between align-items-center" to={`/my-lists/${list.id}/warscroll/${unit.slug}`}>
                  <span className="fw-bold text-uppercase text-info" style={{ fontSize: '0.85rem' }}>{unit.displayName}</span>
                  <i className="bi bi-chevron-right text-secondary"></i>
                </Link>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {unit.keywords.map((k, i) => (
                    <span key={i} className={`badge ${getBadgeColor(k)}`} style={{ fontSize: '0.45rem' }}>{k}</span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RESSOURCES SECONDAIRES */}
      <div className="row g-3 mt-4">
        {/* TACTIQUES */}
        <div className="col-12 col-md-4">
           <div className="bg-black border border-danger border-opacity-25 h-100">
            <div className="bg-danger text-white p-1 px-3 fw-bold text-uppercase small">Battle Tactics</div>
            <div className="p-3">
              {detectedTactics.length > 0 ? detectedTactics.map((bt, idx) => (
                <div key={idx} className="text-white-50 small mb-2 text-uppercase">
                  <i className="bi bi-chevron-right text-danger me-2"></i>{bt.name}
                </div>
              )) : <small className="text-muted">AUCUNE TACTIQUE SÉLECTIONNÉE</small>}
            </div>
          </div>
        </div>

        {/* SORTS */}
        {activeSpellLore.length > 0 && (
          <div className="col-12 col-md-4">
            <div className="bg-black border border-primary border-opacity-25 h-100">
              <div className="bg-primary text-white p-1 px-3 fw-bold text-uppercase small">Lore: {displayData.spellLore}</div>
              <div className="p-0">
                {activeSpellLore.map((spell, idx) => (
                  <div key={idx} className="d-flex justify-content-between p-2 px-3 border-bottom border-secondary border-opacity-10">
                    <span className="text-white small text-uppercase" style={{fontSize: '0.7rem'}}>{spell.name}</span>
                    <span className="text-primary fw-bold small" style={{fontSize: '0.6rem'}}>CV: {spell.castingValue}+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MANIFESTATIONS */}
        {factionManifestations.length > 0 && (
          <div className="col-12 col-md-4">
             <div className="bg-black border border-info border-opacity-25 h-100">
              <div className="bg-info text-black p-1 px-3 fw-bold text-uppercase small">Manifestations</div>
              <div className="p-0">
                {factionManifestations.map((m, idx) => (
                  <Link key={idx} className="text-decoration-none d-flex justify-content-between p-2 px-3 border-bottom border-secondary border-opacity-10" to={`/my-lists/${list.id}/warscroll/${formatSlug(m.name)}`}>
                    <span className="text-white small text-uppercase" style={{fontSize: '0.7rem'}}>{m.name}</span>
                    <span className="text-info fw-bold small" style={{fontSize: '0.6rem'}}>CV: {m.displayCV}+</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .data-card { display: flex; background: #050505; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
        .card-points-sidebar { width: 65px; min-width: 65px; background: #0dcaf0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #000; font-weight: 900; }
        .points-label { font-size: 0.5rem; line-height: 1; opacity: 0.8; }
        .points-val { font-size: 1rem; line-height: 1.1; }
        .card-main { flex-grow: 1; position: relative; display: flex; align-items: center; padding: 0 15px; overflow: hidden; }
        .card-image-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
        .card-content-overlay { position: relative; z-index: 2; flex-grow: 1; }
        .faction-pill { font-size: 0.55rem; background: rgba(0, 0, 0, 0.7); color: #ffc107; padding: 2px 8px; border: 1px solid #ffc107; text-transform: uppercase; font-weight: bold; }
        .army-name-display { color: #fff; font-weight: 800; letter-spacing: 1px; }
        .bottom-meta { font-size: 0.65rem; color: rgba(255,255,255,0.6); font-weight: bold; }
        .dock-btn { background: rgba(0,0,0,0.5); border: 1px solid #0dcaf0; color: #0dcaf0; width: auto; padding: 0.5rem 1rem; height: 35px; display: flex; align-items: center; justify-content: center; }
        .shadow-text { text-shadow: 2px 2px 4px #000; }
        .blur-bg { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      `}</style>
    </div>
  );
}