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

  useEffect(() => {
    // 1. RÉCUPÉRATION (Le tri pour l'affichage global doit se faire dans le composant MyLists)
    const savedRaw = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    
    // Pour garantir qu'on trouve la bonne liste même si l'ID est un nombre ou une string
    const found = savedRaw.find(l => l.id?.toString() === id?.toString());
    
    if (found) {
      setList(found);
      const data = found.listData || found; 
      
      const allWarscrolls = Object.values(warscrollsData).flatMap(cat => 
        Object.values(cat).flatMap(f => f)
      );

      // --- 1. GESTION DES SORTS ---
      const cleanFactionKey = bannerMapping[data.faction] || normalize(data.faction);
      const factionSpells = spellsIndex.factions[cleanFactionKey] || {};
      const loreName = data.spellLore;
      const matchedLore = Object.keys(factionSpells).find(l => normalize(l) === normalize(loreName));
      
      if (matchedLore) {
        setActiveSpellLore(factionSpells[matchedLore]);
      } else if (Object.keys(factionSpells).length > 0 && loreName !== "Non défini") {
        setActiveSpellLore(Object.values(factionSpells)[0]);
      }

      // --- 2. TERRAIN DE FACTION ---
      const terrainInfo = factionTerrainIndex[cleanFactionKey];
      if (terrainInfo) {
        const terrainWS = allWarscrolls.find(ws => normalize(ws.name) === normalize(terrainInfo.name));
        if (terrainWS) setFactionTerrainWS(terrainWS);
      }

      // --- 3. MANIFESTATIONS ---
      const manifestationLoreName = data.manifestationLore;
      const mfs = [];
      const seenMfs = new Set();
      const allowedGenericNames = (manifestationsIndex.generics[manifestationLoreName] || []).map(n => normalize(n));
      const factionMfsData = manifestationsIndex.factions[cleanFactionKey] || [];
      const allowedFactionNames = factionMfsData.map(m => normalize(m.name));

      allWarscrolls.forEach(ws => {
        const normWSName = normalize(ws.name);
        const kws = getKeywordsFromWS(ws.html);
        if (kws.includes("MANIFESTATION")) {
          const isAllowed = allowedGenericNames.includes(normWSName) || allowedFactionNames.includes(normWSName);
          if (isAllowed && !seenMfs.has(normWSName)) {
            seenMfs.add(normWSName);
            const cvMatch = [...factionMfsData, ...(manifestationsIndex.warscrolls || [])].find(m => normalize(m.name) === normWSName);
            mfs.push({ ...ws, displayCV: cvMatch ? cvMatch.castingValue : "7" });
          }
        }
      });
      setFactionManifestations(mfs);

      // --- 4. UNITÉS DU RÉGIMENT ---
      const regs = data.regiments || [];
      const seenUnits = new Set();
      const finalUnits = [];
      
      regs.forEach(reg => {
        const items = [];
        if (reg.hero) items.push(reg.hero);
        if (reg.units) items.push(...reg.units);

        items.forEach(item => {
          let rawName = item.name || item.unitName || "";
          if (!rawName || rawName.trim().startsWith('•')) return;

          let cleanName = rawName.replace(/\s\(\d+.*pts\)$/i, "").replace(/\s\(\d+\)$/i, "").trim();
          const norm = normalize(cleanName);
          
          if (!norm || seenUnits.has(norm)) return;
          
          const match = allWarscrolls.find(ws => normalize(ws.name) === norm || normalize(ws.slug) === norm);
          let kws = [];
          if (match) {
            kws = getKeywordsFromWS(match.html);
            cleanName = match.name; 
          }
          
          seenUnits.add(norm);
          finalUnits.push({ displayName: cleanName, keywords: kws });
        });
      });
      
      setUniqueUnits(finalUnits.sort((a,b) => a.displayName.localeCompare(b.displayName)));
    }
  }, [id]);

  const detectedTactics = useMemo(() => {
    if (!list || !battleTacticsData) return [];
    const data = list.listData || list;
    const savedTacticIdentifiers = data.battle_tactics || [];

    return battleTacticsData.filter(bt => {
      return savedTacticIdentifiers.some(identifier => {
        const cleanSaved = normalize(identifier);
        return normalize(bt.id) === cleanSaved || 
               normalize(bt.name) === cleanSaved ||
               bt.rulesTable?.toLowerCase().includes(`<b>${identifier.toUpperCase()}</b>`);
      });
    });
  }, [list]);

  const formatSlug = (name) => name.toLowerCase().replace(/['’]/g, '-').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  
  const getBadgeColor = (k) => {
    if (k.includes("HERO")) return "bg-warning text-dark fw-bold";
    if (k.includes("WIZARD")) return "bg-primary text-white";
    if (k.includes("MONSTER")) return "bg-danger text-white";
    return "bg-dark text-white-50 border border-secondary border-opacity-50";
  };

  if (!list) return (
    <div className="container mt-5 text-center text-white">
      <div className="spinner-border text-info mb-3"></div>
      <p>Chargement des parchemins...</p>
    </div>
  );

  const displayData = list.listData || list;

  return (
    <div className="container mt-4 pb-5 px-2 font-monospace">
      <div className="mb-3">
        <Link className="btn btn-sm btn-outline-secondary border-secondary text-uppercase fw-bold" style={{fontSize: '0.7rem'}} to="/my-lists">
          ← Retour
        </Link>
      </div>

      <div className="card bg-dark border-0 shadow-lg mb-4 rounded-4 overflow-hidden position-relative" style={{ minHeight: '180px' }}>
        <img 
            src={`/img/banner_${bannerMapping[displayData.faction] || 'default'}.webp`} 
            className="card-img" 
            alt="" 
            style={{ objectFit: 'cover', height: '100%', minHeight: '180px', opacity: '0.35' }} 
            onError={(e) => e.target.src = "/img/banner_default.webp"}
        />
        <div className="card-img-overlay d-flex flex-column justify-content-center align-items-center text-center p-2">
          <h2 className="fw-bold text-white mb-1 text-uppercase shadow-text" style={{ fontSize: 'clamp(1.2rem, 5vw, 2.2rem)' }}>
            {list.title || displayData.title || displayData.customTitle || "Ost sans nom"}
          </h2>
          <div className="badge bg-info mb-3 px-3 py-1 fw-bold shadow-sm bg-opacity-25 border border-info blur-bg text-uppercase" style={{ fontSize: '0.7rem' }}>
            {displayData.faction} • {displayData.subFaction}
          </div>
          
          <div className="d-flex flex-wrap justify-content-center gap-2 align-items-center w-100">
            {detectedTactics.length > 0 ? (
              <div className="px-3 py-2 rounded bg-danger bg-opacity-25 border border-danger border-opacity-25 shadow-sm blur-bg">
                <small className="text-white-50 d-block text-uppercase mb-1" style={{ fontSize: '0.5rem' }}>Tactiques de Bataille</small>
                <span className="fw-bold text-white d-block" style={{ fontSize: '0.7rem' }}>
                  {detectedTactics.map(bt => bt.name).join(' • ')}
                </span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded bg-dark bg-opacity-50 border border-white border-opacity-10 blur-bg">
                <small className="text-white-50" style={{ fontSize: '0.6rem' }}>Aucune tactique sélectionnée</small>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 mb-4 blur-bg">
        <div className="card-header bg-black text-white py-3 px-3">
          <h6 className="mb-0 fw-bold text-uppercase small"><i className="bi bi-shield-shaded me-2 text-info"></i>Unités de Guerre</h6>
        </div>
        <div className="list-group list-group-flush">
          {uniqueUnits.map((unit, idx) => (
            <div key={idx} className="list-group-item p-3 bg-transparent text-white border-secondary border-opacity-10 position-relative">
              <Link className="text-decoration-none text-white stretched-link" to={`/my-lists/${list.id}/warscroll/${formatSlug(unit.displayName)}`}>
                <h6 className="fw-bold mb-1 text-uppercase" style={{ fontSize: '0.9rem' }}>{unit.displayName}</h6>
              </Link>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {unit.keywords.map((k, i) => (
                  <span key={i} className={`badge ${getBadgeColor(k)}`} style={{ fontSize: '0.55rem', zIndex: 2 }}>{k}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row g-3">
        {factionTerrainWS && (
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg">
              <div className="card-header bg-black py-2 px-3 border-bottom border-warning border-opacity-25">
                <h6 className="mb-0 fw-bold text-uppercase small text-warning">🏰 Elément de Terrain</h6>
              </div>
              <Link className="text-decoration-none d-flex justify-content-between align-items-center p-3 text-white" to={`/my-lists/${list.id}/warscroll/${formatSlug(factionTerrainWS.name)}`}>
                <span className="fw-bold text-uppercase" style={{ fontSize: '0.8rem' }}>{factionTerrainWS.name}</span>
                <i className="bi bi-chevron-right text-warning"></i>
              </Link>
            </div>
          </div>
        )}

        {factionManifestations.length > 0 && (
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg h-100">
              <div className="card-header bg-black py-2 px-3 border-bottom border-info border-opacity-25">
                <h6 className="mb-0 fw-bold text-uppercase small text-info">🔥 Manifestations</h6>
              </div>
              <div className="list-group list-group-flush">
                {factionManifestations.map((m, idx) => (
                  <Link key={idx} className="list-group-item list-group-item-action bg-transparent text-white border-secondary border-opacity-10 d-flex align-items-center p-3" to={`/my-lists/${list.id}/warscroll/${formatSlug(m.name)}`}>
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.8rem' }}>{m.name}</span>
                    <span className="ms-auto badge bg-success bg-opacity-25 border border-success rounded-pill" style={{ fontSize: '0.6rem' }}>CV: {m.displayCV}+</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSpellLore.length > 0 && (
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg h-100">
              <div className="card-header bg-black py-2 px-3 border-bottom border-primary border-opacity-25">
                <h6 className="mb-0 fw-bold text-uppercase small text-primary">🪄 Sorts ({displayData.spellLore})</h6>
              </div>
              <div className="list-group list-group-flush">
                {activeSpellLore.map((spell, idx) => (
                  <div key={idx} className="list-group-item bg-transparent text-white border-secondary border-opacity-10 d-flex align-items-center p-3">
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.8rem' }}>{spell.name}</span>
                    <span className="ms-auto badge bg-primary bg-opacity-25 border border-primary rounded-pill" style={{ fontSize: '0.6rem' }}>CV: {spell.castingValue}+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .blur-bg { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .shadow-text { text-shadow: 2px 2px 8px rgba(0,0,0,0.8); }
        .list-group-item-action:hover { background-color: rgba(255,255,255,0.05) !important; }
      `}</style>
    </div>
  );
}