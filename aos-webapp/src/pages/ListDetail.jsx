import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";

export default function ListDetail() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [uniqueUnits, setUniqueUnits] = useState([]);
  const [detectedTerrain, setDetectedTerrain] = useState(null);

  const bannerMapping = {
    "Helsmiths": "helsmiths",
    "Ossiarch Bonereapers": "ossiarch", "Soulblight Gravelords": "soulblight",
    "Nighthaunt": "nighthaunt", "Flesh-eater Courts": "flesheater",
    "Sons of Behemat": "sonsofbehemat", "Idoneth Deepkin": "idoneth",
    "Blades of Khorne": "khorne", "Sylvaneth": "sylvaneth",
    "Disciples of Tzeentch": "tzeentch", "Ironjawz": "ironjawz",
    "Gloomspite Gitz": "gloomspite", "Slaves to Darkness": "slaves",
    "Lumineth Realm-lords": "lumineth", "Hedonites of Slaanesh": "slaanesh",
    "Skaven": "skaven", "Daughters of Khaine": "daughtersofkhaine",
    "Kruleboyz": "kruleboyz", "Kharadron Overlords": "kharadron",
    "Cities of Sigmar": "citiesofsigmar", "Fyreslayers": "fyreslayers",
    "Seraphon": "seraphon", "Stormcast Eternals": "stormcast",
    "Maggotkin of Nurgle": "nurgle", "Ogor Mawtribes": "ogor"
  };

  const cleanAORPrefix = (name) => {
    return name
      .replace(/^Legion of the First Prince\s+/i, "")
      .replace(/^Scourge of Ghyran\s+/i, "")
      .trim();
  };

  const normalize = (str) => 
    str?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’\s-]/g, "")
      .trim() || "";

  const getKeywordsFromWS = (html) => {
    if (!html) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const keywordElement = doc.querySelector(".wsKeywordLine1");
    if (!keywordElement) return [];
    return keywordElement.textContent
      .replace(/KEYWORDS\s*:/i, "")
      .replace(/MOTS-CLÉS\s*:/i, "")
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

      const blacklist = ["GENERAL", "REINFORCED", "ARMY OF RENOWN", "DROPS"];
      const rawUnits = found.regiments.flatMap(reg => reg.units || []);
      const seen = new Set();
      let terrainFound = null;

      const filteredUnits = rawUnits
        .filter(unit => {
          if (!unit || unit.length < 3) return false;
          let cleanName = unit.split(',')[0].split('(')[0].trim();
          cleanName = cleanAORPrefix(cleanName);
          if (blacklist.some(b => cleanName.toUpperCase().includes(b))) return false;

          const wsMatch = allWarscrolls.find(ws => normalize(ws.name) === normalize(cleanName));
          if (wsMatch) {
            const kws = getKeywordsFromWS(wsMatch.html);
            if (kws.includes("TERRAIN") || kws.includes("FACTION TERRAIN")) {
              terrainFound = wsMatch.name;
              return false;
            }
          }

          const normName = normalize(cleanName);
          if (!seen.has(normName)) {
            seen.add(normName);
            return true;
          }
          return false;
        })
        .sort((a, b) => a.localeCompare(b));

      setUniqueUnits(filteredUnits);
      setDetectedTerrain(terrainFound);
    }
  }, [id]);

  const getUnitKeywords = (unitName) => {
    const allWarscrolls = Object.values(warscrollsData).flatMap(cat => Object.values(cat).flatMap(f => f));
    let baseName = unitName.split(',')[0].split('(')[0].trim();
    baseName = cleanAORPrefix(baseName);
    const cleanSearch = normalize(baseName);
    let found = allWarscrolls.find(ws => normalize(ws.name) === cleanSearch);
    return found ? getKeywordsFromWS(found.html) : [];
  };

  const getBadgeColor = (keyword) => {
    const k = keyword.toUpperCase();
    if (k.includes("HERO")) return "bg-warning text-dark fw-bold";
    if (k.includes("MONSTER")) return "bg-danger text-white fw-bold";
    if (k.includes("WIZARD") || k.includes("SORCIER")) return "bg-primary text-white";
    if (k.includes("INFANTRY")) return "bg-info text-dark";
    if (k.includes("CAVALRY")) return "bg-success text-white";
    return "bg-dark text-white-50 border border-secondary border-opacity-50";
  };

  const formatSlug = (name) => {
    if (!name) return "";
    let clean = name.split(',')[0].split('(')[0].trim();
    clean = cleanAORPrefix(clean);
    return clean.toLowerCase().replace(/['’]/g, '-').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  };

  if (!list) return <div className="container mt-5 text-center text-white">Chargement...</div>;

  const finalTerrain = detectedTerrain || (list.terrain !== "Non défini" ? list.terrain : null);

  const infoItems = [
    { label: 'Sorts', val: list.spellLore },
    { label: 'Manifestations', val: list.manifestationLore },
    { label: 'Terrain', val: finalTerrain }
  ].filter(item => item.val && item.val !== "Non défini");

  return (
    <div className="container mt-4 pb-5 px-3">
      <div className="mb-3">
        <Link to="/my-lists" className="btn btn-sm btn-outline-secondary border-secondary">← Retour</Link>
      </div>

      {/* BANNIÈRE AVEC CAROUSEL RESPONSIVE */}
      <div className="card bg-dark border-0 shadow-lg mb-4 rounded-4 overflow-hidden position-relative" style={{ minHeight: '300px' }}>
        <img 
          src={`/img/banner_${bannerMapping[list.faction] || 'default'}.webp`} 
          className="card-img" 
          alt={list.faction} 
          style={{ objectFit: 'cover', height: '100%', minHeight: '300px', opacity: '0.4' }} 
        />
        <div className="card-img-overlay d-flex flex-column justify-content-center align-items-center text-center p-3">
            <h2 className="fw-bold text-white mb-1 text-uppercase shadow-text" style={{ fontSize: 'clamp(1.2rem, 5vw, 2.5rem)' }}>{list.faction}</h2>
            <div className="badge bg-info mb-4 px-3 py-2 fw-bold text-wrap shadow-sm">{list.subFaction}</div>
            
            <div className="w-100 position-relative">
                {/* VERSION MOBILE : CAROUSEL AVEC INDICATORS ET FLÈCHES */}
                <div id="infoCarousel" className="carousel slide d-block d-md-none" data-bs-ride="false" data-bs-touch="true">
                    
                    {/* Indicateurs (petits traits en bas) */}
                    {infoItems.length > 1 && (
                        <div className="carousel-indicators mt-2" style={{ marginBottom: "-15px" }}>
                            {infoItems.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    data-bs-target="#infoCarousel"
                                    data-bs-slide-to={idx}
                                    className={idx === 0 ? "active" : ""}
                                    aria-current={idx === 0 ? "true" : "false"}
                                    aria-label={`Slide ${idx + 1}`}
                                ></button>
                            ))}
                        </div>
                    )}

                    <div className="carousel-inner">
                        {infoItems.map((item, idx) => (
                            <div key={idx} className={`carousel-item ${idx === 0 ? 'active' : ''}`}>
                                <div className="px-2 py-2 rounded bg-dark bg-opacity-50 border border-white border-opacity-10 shadow-sm blur-bg mx-auto mb-3" style={{ maxWidth: '250px' }}>
                                    <small className="text-white-50 d-block text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>{item.label}</small>
                                    <span className="fw-bold text-info" style={{ fontSize: '0.9rem' }}>{item.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Flèches mobiles */}
                    {infoItems.length > 1 && (
                      <>
                        <button className="carousel-control-prev" type="button" data-bs-target="#infoCarousel" data-bs-slide="prev" style={{ width: '15%' }}>
                          <span className="carousel-control-prev-icon" aria-hidden="true" style={{ width: '1.2rem' }}></span>
                        </button>
                        <button className="carousel-control-next" type="button" data-bs-target="#infoCarousel" data-bs-slide="next" style={{ width: '15%' }}>
                          <span className="carousel-control-next-icon" aria-hidden="true" style={{ width: '1.2rem' }}></span>
                        </button>
                      </>
                    )}
                </div>

                {/* VERSION DESKTOP : GRILLE FIXE */}
                <div className="d-none d-md-flex flex-wrap justify-content-center gap-2 align-items-center">
                    {infoItems.map((item, idx) => (
                        <div key={idx} className="px-2 py-2 rounded bg-dark bg-opacity-50 border border-white border-opacity-10 shadow-sm blur-bg" style={{ minWidth: '120px', flex: '1 1 auto', maxWidth: '200px' }}>
                            <small className="text-white-50 d-block text-uppercase mb-1" style={{ fontSize: '0.5rem' }}>{item.label}</small>
                            <span className="fw-bold text-info" style={{ fontSize: '0.75rem' }}>{item.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* BLOC UNITÉS */}
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 mb-4 blur-bg">
        <div className="card-header bg-black text-white py-3 px-4">
          <h5 className="mb-0 fw-bold text-uppercase small text-primary">⚔️ Unités de la liste</h5>
        </div>
        <div className="list-group list-group-flush bg-transparent">
          {uniqueUnits.map((unit, idx) => {
            const keywords = getUnitKeywords(unit);
            const displayName = cleanAORPrefix(unit.split('(')[0].trim());
            return (
              <div key={idx} className="list-group-item p-3 bg-transparent text-white border-secondary border-opacity-10 position-relative">
                <div className="d-flex justify-content-between align-items-center">
                  <Link to={`/my-lists/${list.id}/warscroll/${formatSlug(unit)}`} className="text-decoration-none text-white flex-grow-1 stretched-link">
                    <h6 className="fw-bold mb-0 text-uppercase me-2" style={{ fontSize: '0.9rem' }}>
                      {displayName} <span className="text-primary ms-1" style={{ fontSize: '0.8rem' }}>🔍</span>
                    </h6>
                    <div className="d-none d-md-flex flex-wrap gap-1 mt-1">
                      {keywords.map((k, i) => (
                        <span key={i} className={`badge ${getBadgeColor(k)}`} style={{ fontSize: '0.55rem' }}>{k}</span>
                      ))}
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOC TERRAIN */}
      {finalTerrain && (
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 mb-4 blur-bg">
          <div className="card-header bg-black text-white py-3 px-4">
            <h5 className="mb-0 fw-bold text-uppercase small text-warning">🏰 Terrain de Faction</h5>
          </div>
          <div className="card-body text-white p-3 p-md-4">
            <Link to={`/my-lists/${list.id}/warscroll/${formatSlug(finalTerrain)}`} className="text-decoration-none text-white d-block">
              <h6 className="fw-bold mb-0 text-uppercase">
                {finalTerrain} <span className="text-warning ms-1" style={{ fontSize: '0.8rem' }}>🔍</span>
              </h6>
            </Link>
          </div>
        </div>
      )}

      <style>{`
        .blur-bg { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .shadow-text { text-shadow: 2px 2px 8px rgba(0,0,0,0.8); }
        .carousel-item { transition: transform .5s ease-in-out; }
        .carousel-control-prev, .carousel-control-next { filter: drop-shadow(0px 0px 2px black); }
        .carousel-indicators [data-bs-target] { width: 15px; height: 2px; }
      `}</style>
    </div>
  );
}