import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";
import manifestationsIndex from "../data/manifestationsIndex.json";
import spellsIndex from "../data/spellsIndex.json"; // Import de l'index des sorts

export default function ListDetail() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [uniqueUnits, setUniqueUnits] = useState([]);
  const [detectedTerrain, setDetectedTerrain] = useState(null);
  const [factionManifestations, setFactionManifestations] = useState([]);
  const [factionTerrainWS, setFactionTerrainWS] = useState(null);
  const [activeSpellLore, setActiveSpellLore] = useState([]); // Nouvel état pour les sorts

  const bannerMapping = {
    "Helsmiths": "helsmiths", "Ossiarch Bonereapers": "ossiarch", 
    "Soulblight Gravelords": "soulblight", "Nighthaunt": "nighthaunt", 
    "Flesh-eater Courts": "flesheater", "Sons of Behemat": "sonsofbehemat", 
    "Idoneth Deepkin": "idoneth", "Blades of Khorne": "khorne", 
    "Sylvaneth": "sylvaneth", "Disciples of Tzeentch": "tzeentch", 
    "Ironjawz": "ironjawz", "Gloomspite Gitz": "gloomspite", 
    "Slaves to Darkness": "slaves", "Lumineth Realm-lords": "lumineth", 
    "Hedonites of Slaanesh": "slaanesh", "Skaven": "skaven", 
    "Daughters of Khaine": "daughtersofkhaine", "Kruleboyz": "kruleboyz", 
    "Kharadron Overlords": "kharadron", "Cities of Sigmar": "citiesofsigmar", 
    "Fyreslayers": "fyreslayers", "Seraphon": "seraphon", 
    "Stormcast Eternals": "stormcast", "Maggotkin of Nurgle": "nurgle", 
    "Ogor Mawtribes": "ogor"
  };

  const normalize = (str) => 
    str?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim() || "";

  const getKeywordsFromWS = (html) => {
    if (!html) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const keywordElement = doc.querySelector(".wsKeywordLine1");
    if (!keywordElement) return [];
    return keywordElement.textContent
      .replace(/(KEYWORDS|MOTS-CLÉS)\s*:/i, "")
      .toUpperCase()
      .split(/[,•]/)
      .map(k => k.trim())
      .filter(k => k !== "");
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    const found = saved.find(l => l.id.toString() === id);
    
    if (found) {
      setList(found);
      const allWarscrolls = Object.values(warscrollsData).flatMap(cat => 
        Object.values(cat).flatMap(faction => faction)
      );

      // CORRECTION : On utilise le mapping pour avoir la clé exacte du JSON (ex: 'soulblight')
      const cleanFactionKey = bannerMapping[found.faction] || normalize(found.faction);

      // --- Détection des Sorts (Spell Lore) ---
      const factionSpells = spellsIndex.factions[cleanFactionKey] || {};
      const matchedLoreName = Object.keys(factionSpells).find(
        lore => normalize(lore) === normalize(found.spellLore)
      );
      if (matchedLoreName) {
        setActiveSpellLore(factionSpells[matchedLoreName]);
      } else {
        setActiveSpellLore([]); // Reset si non trouvé
      }

      // --- Détection du Terrain et des Manifestations ---
      const factionCVs = manifestationsIndex.factions[cleanFactionKey] || [];
      
      let factionUnits = [];
      for (const cat of Object.values(warscrollsData)) {
        for (const [fName, units] of Object.entries(cat)) {
          // On vérifie le nom de faction normalisé ou via le mapping
          if (normalize(fName) === cleanFactionKey || bannerMapping[fName] === cleanFactionKey) {
            factionUnits = units;
            break;
          }
        }
      }

      const mfs = [];
      let terr = null;

      factionUnits.forEach(ws => {
        const kws = getKeywordsFromWS(ws.html);
        if (kws.includes("MANIFESTATION") && !kws.includes("HERO")) {
          const cvData = factionCVs.find(m => normalize(m.name) === normalize(ws.name));
          mfs.push({ ...ws, displayCV: cvData ? cvData.castingValue : null });
        }
        if (kws.includes("FACTION TERRAIN") || kws.includes("TERRAIN")) {
          terr = ws;
        }
      });
      setFactionManifestations(mfs);
      setFactionTerrainWS(terr);

      const rawUnits = found.regiments.flatMap(reg => reg.units || []);
      const seen = new Set();
      let terrainFoundInList = null;

      const filtered = rawUnits.reduce((acc, unitLine) => {
        const trimmed = unitLine.trim();
        if (trimmed.startsWith('•') || trimmed.startsWith('·') || trimmed.toLowerCase().includes('reinforced')) return acc;

        let displayName = trimmed.replace(/\s\(\d+\s*pts\)$/i, "").replace(/\s\(\d+\)$/i, "").trim();
        displayName = displayName.replace(/^Legion of the First Prince\s+/i, "").replace(/^Scourge of Ghyran\s+/i, "").trim();
        
        const normName = normalize(displayName);
        const wsMatch = allWarscrolls.find(ws => normalize(ws.name) === normName);
        
        let kws = [];
        if (wsMatch) {
          kws = getKeywordsFromWS(wsMatch.html);
          if (kws.includes("TERRAIN") || kws.includes("FACTION TERRAIN")) {
            terrainFoundInList = wsMatch.name;
            return acc;
          }
        }

        if (!seen.has(normName)) {
          seen.add(normName);
          acc.push({ displayName, keywords: kws });
        }
        return acc;
      }, []).sort((a, b) => a.displayName.localeCompare(b.displayName));

      setUniqueUnits(filtered);
      setDetectedTerrain(terrainFoundInList);
    }
  }, [id]);

  if (!list) return <div className="container mt-5 text-center text-white">Chargement...</div>;

  const finalTerrain = detectedTerrain || (list.terrain !== "Non défini" ? list.terrain : null);
  const infoItems = [
    { label: 'Sorts', val: list.spellLore },
    { label: 'Manifestations', val: list.manifestationLore },
    { label: 'Terrain', val: finalTerrain }
  ].filter(item => item.val && item.val !== "Non défini");

  const getBadgeColor = (keyword) => {
    const k = keyword.toUpperCase();
    if (k.includes("HERO")) return "bg-warning text-dark fw-bold";
    if (k.includes("MONSTER")) return "bg-danger text-white fw-bold";
    if (k.includes("WIZARD") || k.includes("SORCIER")) return "bg-primary text-white";
    return "bg-dark text-white-50 border border-secondary border-opacity-50";
  };

  const formatSlug = (name) => name.toLowerCase().replace(/['’]/g, '-').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

  return (
    <div className="container mt-4 pb-5 px-3">
      <div className="mb-3">
        <Link to="/my-lists" className="btn btn-sm btn-outline-secondary border-secondary">← Retour</Link>
      </div>

      {/* BANNER CARD */}
      <div className="card bg-dark border-0 shadow-lg mb-4 rounded-4 overflow-hidden position-relative" style={{ minHeight: '200px' }}>
        <img src={`/img/banner_${bannerMapping[list.faction] || 'default'}.webp`} className="card-img" alt="" style={{ objectFit: 'cover', height: '100%', minHeight: '200px', opacity: '0.4' }} />
        <div className="card-img-overlay d-flex flex-column justify-content-center align-items-center text-center p-3">
          <h2 className="fw-bold text-white mb-1 text-uppercase shadow-text" style={{ fontSize: 'clamp(1.2rem, 5vw, 2.5rem)' }}>{list.faction}</h2>
          <div className="badge bg-info mb-4 px-3 py-2 fw-bold text-wrap shadow-sm bg-opacity-25 border-2 border border-info blur-bg">{list.subFaction}</div>
          <div className="d-md-flex d-none flex-wrap justify-content-center gap-2 align-items-center">
              {infoItems.map((item, idx) => (
                <div key={idx} className="px-2 py-2 rounded bg-dark bg-opacity-50 border border-white border-opacity-10 shadow-sm blur-bg" style={{ minWidth: '120px', flex: '1 1 auto', maxWidth: '200px' }}>
                  <small className="text-white-50 d-block text-uppercase mb-1" style={{ fontSize: '0.5rem' }}>{item.label}</small>
                  <span className="fw-bold text-info" style={{ fontSize: '0.75rem' }}>{item.val}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* UNITÉS DE LA LISTE */}
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 mb-4 blur-bg">
        <div className="card-header bg-black text-white py-3 px-4">
          <h5 className="mb-0 fw-bold text-uppercase small text-white">⚔️ Unités de la liste</h5>
        </div>
        <div className="list-group list-group-flush bg-transparent">
          {uniqueUnits.map((unit, idx) => (
            <div key={idx} className="list-group-item p-3 bg-transparent text-white border-secondary border-opacity-10 position-relative">
              <div className="d-flex flex-column">
                <Link to={`/my-lists/${list.id}/warscroll/${formatSlug(unit.displayName)}`} className="text-decoration-none text-white flex-grow-1 stretched-link">
                  <h6 className="fw-bold mb-0 text-uppercase" style={{ fontSize: '0.9rem' }}>{unit.displayName}</h6>
                </Link>
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {unit.keywords.map((k, i) => (
                    <span key={i} className={`badge ${getBadgeColor(k)}`} style={{ fontSize: '0.55rem', zIndex: 2, position: 'relative' }}>{k}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row g-4">
        {/* TERRAIN DE FACTION */}
        {factionTerrainWS && (
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg h-100">
              <div className="card-header bg-black text-white py-3 px-4 border-bottom border-warning border-opacity-25">
                <h5 className="mb-0 fw-bold text-uppercase small text-warning">🏰 Terrain de Faction</h5>
              </div>
              <div className="card-body p-0">
                <Link to={`/my-lists/${list.id}/warscroll/${formatSlug(factionTerrainWS.name)}`} className="text-decoration-none d-flex justify-content-between align-items-center p-3 text-white border-bottom border-secondary border-opacity-10">
                  <span className="fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>{factionTerrainWS.name}</span>
                  <i className="bi bi-chevron-right text-warning"></i>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* MANIFESTATIONS DE FACTION */}
        {factionManifestations.length > 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg h-100">
              <div className="card-header bg-black text-white py-3 px-4 border-bottom border-info border-opacity-25">
                <h5 className="mb-0 fw-bold text-uppercase small text-info">🔥 Manifestations</h5>
              </div>
              <div className="list-group list-group-flush bg-transparent">
                {factionManifestations.map((m, idx) => (
                  <Link key={idx} to={`/my-lists/${list.id}/warscroll/${formatSlug(m.name)}`} className="list-group-item list-group-item-action bg-transparent text-white border-secondary border-opacity-10 d-flex align-items-center p-3">
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>{m.name}</span>
                    {m.displayCV && <span className="ms-2 badge bg-success bg-opacity-25 border border-1 border-success rounded-pill px-2">Casting value: {m.displayCV}+</span>}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SORT DE FACTION (SPELL LORE) */}
        {activeSpellLore.length > 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg h-100">
              <div className="card-header bg-black text-white py-3 px-4 border-bottom border-primary border-opacity-25">
                <h5 className="mb-0 fw-bold text-uppercase small text-primary">🪄 Sorts : {list.spellLore}</h5>
              </div>
              <div className="list-group list-group-flush bg-transparent">
                {activeSpellLore.map((spell, idx) => (
                  <div key={idx} className="list-group-item bg-transparent text-white border-secondary border-opacity-10 d-flex align-items-center p-3">
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>{spell.name}</span>
                    <span className="ms-2 badge bg-primary bg-opacity-25 border border-1 border-primary rounded-pill px-2">Casting value: {spell.castingValue}+</span>
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
      `}</style>
    </div>
  );
}