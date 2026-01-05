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
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    const found = saved.find(l => l.id.toString() === id);
    
    if (found) {
      setList(found);
      const data = found.listData || found;
      const allWarscrolls = Object.values(warscrollsData).flatMap(cat => Object.values(cat).flatMap(f => f));
      const cleanFactionKey = bannerMapping[data.faction] || normalize(data.faction);

      // 1. SORTS
      const factionSpells = spellsIndex.factions[cleanFactionKey] || {};
      const loreName = data.spellLore;
      const matchedLore = Object.keys(factionSpells).find(l => normalize(l) === normalize(loreName));
      if (matchedLore) setActiveSpellLore(factionSpells[matchedLore]);
      else if (Object.keys(factionSpells).length > 0 && loreName !== "Non défini") setActiveSpellLore(Object.values(factionSpells)[0]);

      // 2. TERRAIN
      const terrainInfo = factionTerrainIndex[cleanFactionKey];
      if (terrainInfo) {
        const terrainWS = allWarscrolls.find(ws => normalize(ws.name) === normalize(terrainInfo.name));
        if (terrainWS) setFactionTerrainWS(terrainWS);
      }

      // 3. MANIFESTATIONS (CORRIGÉ : Filtrage strict par Domaine ou Faction)
      const manifestationLoreName = data.manifestationLore;
      const mfs = [];
      const seenMfs = new Set();

      // On identifie les noms autorisés par le domaine générique choisi
      const allowedGenericNames = (manifestationsIndex.generics[manifestationLoreName] || []).map(n => normalize(n));
      
      // On identifie les manifestations de faction autorisées
      const factionMfsData = manifestationsIndex.factions[cleanFactionKey] || [];
      const allowedFactionNames = factionMfsData.map(m => normalize(m.name));

      allWarscrolls.forEach(ws => {
        const normWSName = normalize(ws.name);
        const kws = getKeywordsFromWS(ws.html);

        if (kws.includes("MANIFESTATION")) {
          // Une manifestation n'est ajoutée QUE si elle est dans le domaine générique OU dans la faction
          const isAllowed = allowedGenericNames.includes(normWSName) || allowedFactionNames.includes(normWSName);

          if (isAllowed && !seenMfs.has(normWSName)) {
            seenMfs.add(normWSName);
            // On cherche la CV (soit dans la faction, soit dans les warscrolls génériques)
            const cvMatch = [...factionMfsData, ...(manifestationsIndex.warscrolls || [])].find(m => normalize(m.name) === normWSName);
            mfs.push({ ...ws, displayCV: cvMatch ? cvMatch.castingValue : "7" });
          }
        }
      });
      setFactionManifestations(mfs);

      // 4. UNITÉS
      const regs = data.regiments || [];
      const seenUnits = new Set();
      const finalUnits = [];
      regs.forEach(reg => {
        const items = [{ d: reg.hero }, ...(reg.units?.map(u => ({ d: u })) || [])].filter(i => i.d);
        items.forEach(item => {
          let rawName = item.d.name || item.d.unitName || "";
          if (rawName.trim().startsWith('•')) return;
          let cleanName = rawName.replace(/\s\(\d+.*pts\)$/i, "").replace(/\s\(\d+\)$/i, "").trim();
          const norm = normalize(cleanName);
          if (!norm || seenUnits.has(norm)) return;
          const match = allWarscrolls.find(ws => normalize(ws.name) === norm);
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

  // BATTLE TACTICS (Filtre strict)
  const detectedTactics = useMemo(() => {
    if (!list || !battleTacticsData) return [];
    const factionName = normalize(list.listData?.faction || list.faction).split(' ')[0];
    return battleTacticsData.filter(bt => 
      normalize(bt.id).includes(factionName) || normalize(bt.id).includes("universal")
    );
  }, [list]);

  const formatSlug = (name) => name.toLowerCase().replace(/['’]/g, '-').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  const getBadgeColor = (k) => {
    if (k.includes("HERO")) return "bg-warning text-dark fw-bold";
    if (k.includes("WIZARD")) return "bg-primary text-white";
    if (k.includes("MONSTER")) return "bg-danger text-white";
    return "bg-dark text-white-50 border border-secondary border-opacity-50";
  };

  if (!list) return <div className="container mt-5 text-center text-white">Chargement...</div>;

  const displayData = list.listData || list;
  const infoItems = [
    { label: 'Sorts', val: displayData.spellLore },
    { label: 'Manifestations', val: displayData.manifestationLore }
  ].filter(item => item.val && item.val !== "Non défini");

  return (
    <div className="container mt-4 pb-5 px-3">
      <div className="mb-3">
        <Link className="btn btn-sm btn-outline-secondary border-secondary" to="/my-lists">← Retour</Link>
      </div>

      <div className="card bg-dark border-0 shadow-lg mb-4 rounded-4 overflow-hidden position-relative" style={{ minHeight: '200px' }}>
        <img src={`/img/banner_${bannerMapping[displayData.faction] || 'default'}.webp`} className="card-img" alt="" style={{ objectFit: 'cover', height: '100%', minHeight: '200px', opacity: '0.4' }} />
        <div className="card-img-overlay d-flex flex-column justify-content-center align-items-center text-center p-3">
          <h2 className="fw-bold text-white mb-1 text-uppercase shadow-text" style={{ fontSize: 'clamp(1.2rem, 5vw, 2.5rem)' }}>{displayData.faction}</h2>
          <div className="badge bg-info mb-4 px-3 py-2 fw-bold text-wrap shadow-sm bg-opacity-25 border-2 border border-info blur-bg">{displayData.subFaction}</div>
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

      <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 mb-4 blur-bg">
        <div className="card-header bg-black text-white py-3 px-4">
          <h5 className="mb-0 fw-bold text-uppercase small text-white">⚔️ Unités de la liste</h5>
        </div>
        <div className="list-group list-group-flush bg-transparent">
          {uniqueUnits.map((unit, idx) => (
            <div key={idx} className="list-group-item p-3 bg-transparent text-white border-secondary border-opacity-10 position-relative">
              <div className="d-flex flex-column">
                <Link className="text-decoration-none text-white flex-grow-1 stretched-link" to={`/my-lists/${list.id}/warscroll/${formatSlug(unit.displayName)}`}>
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
        {factionTerrainWS && (
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg">
              <div className="card-header bg-black text-white py-3 px-4 border-bottom border-warning border-opacity-25">
                <h5 className="mb-0 fw-bold text-uppercase small text-warning">🏰 Terrain de Faction</h5>
              </div>
              <div className="card-body p-0">
                <Link className="text-decoration-none d-flex justify-content-between align-items-center p-3 text-white" to={`/my-lists/${list.id}/warscroll/${formatSlug(factionTerrainWS.name)}`}>
                  <span className="fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>{factionTerrainWS.name}</span>
                  <i className="bi bi-chevron-right text-warning"></i>
                </Link>
              </div>
            </div>
          </div>
        )}

        {factionManifestations.length > 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg">
              <div className="card-header bg-black text-white py-3 px-4 border-bottom border-info border-opacity-25">
                <h5 className="mb-0 fw-bold text-uppercase small text-info">🔥 Manifestations</h5>
              </div>
              <div className="list-group list-group-flush bg-transparent">
                {factionManifestations.map((m, idx) => (
                  <Link key={idx} className="list-group-item list-group-item-action bg-transparent text-white border-secondary border-opacity-10 d-flex align-items-center p-3" to={`/my-lists/${list.id}/warscroll/${formatSlug(m.name)}`}>
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>{m.name}</span>
                    <span className="ms-2 badge bg-success bg-opacity-25 border border-1 border-success rounded-pill px-2">CV: {m.displayCV}+</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSpellLore.length > 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg">
              <div className="card-header bg-black text-white py-3 px-4 border-bottom border-primary border-opacity-25">
                <h5 className="mb-0 fw-bold text-uppercase small text-primary">🪄 Sorts : {displayData.spellLore}</h5>
              </div>
              <div className="list-group list-group-flush bg-transparent">
                {activeSpellLore.map((spell, idx) => (
                  <div key={idx} className="list-group-item bg-transparent text-white border-secondary border-opacity-10 d-flex align-items-center p-3">
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>{spell.name}</span>
                    <span className="ms-2 badge bg-primary bg-opacity-25 border border-1 border-primary rounded-pill px-2">CV: {spell.castingValue}+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {detectedTactics.length > 0 && (
          <div className="col-12 mt-4">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-dark border border-secondary border-opacity-25 blur-bg">
              <div className="card-header bg-black text-white py-3 px-4 border-bottom border-danger border-opacity-25 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-uppercase small text-danger">📋 Battle Tactics</h5>
                <Link className="btn btn-outline-danger btn-sm py-0" to="/battletactics" style={{ fontSize: '0.65rem' }}>VOIR TOUT</Link>
              </div>
              <div className="list-group list-group-flush bg-transparent">
                {detectedTactics.map((bt, idx) => (
                  <div key={idx} className="list-group-item bg-transparent text-white border-secondary border-opacity-10 p-3">
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.85rem', color: '#eee' }}>{bt.name}</span>
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