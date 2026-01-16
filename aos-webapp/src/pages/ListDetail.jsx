import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";
import manifestationsIndex from "../data/manifestationsIndex.json";
import manifestationsData from "../data/manifestations_detailed.json"; // TON NOUVEAU FICHIER
import spellsIndex from "../data/spellsIndex.json";
import battleTacticsData from "../data/battletactics.json";

export default function ListDetail() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [uniqueUnits, setUniqueUnits] = useState([]);
  const [factionManifestations, setFactionManifestations] = useState([]);
  const [activeSpellLore, setActiveSpellLore] = useState([]);
  const [viewMode, setViewMode] = useState("regiments");

  const bannerMapping = {
    "cities of sigmar": "citiesofsigmar",
    "daughters of khaine": "daughtersofkhaine",
    "flesh-eater courts": "flesheater",
    "fyreslayers": "fyreslayers",
    "gloomspite gitz": "gloomspite",
    "helsmiths": "helsmiths",
    "idoneth deepkin": "idoneth",
    "ironjawz": "ironjawz",
    "kharadron overlords": "kharadron",
    "blades of khorne": "khorne",
    "kruleboyz": "kruleboyz",
    "lumineth realm-lords": "lumineth",
    "nighthaunt": "nighthaunt",
    "maggotkin of nurgle": "nurgle",
    "ogor mawtribes": "ogor",
    "ossiarch bonereapers": "ossiarch",
    "seraphon": "seraphon",
    "skaven": "skaven",
    "hedonites of slaanesh": "slaanesh",
    "slaves to darkness": "slaves",
    "sons of behemat": "sonsofbehemat",
    "soulblight gravelords": "soulblight",
    "stormcast eternals": "stormcast",
    "sylvaneth": "sylvaneth",
    "disciples of tzeentch": "tzeentch"
  };

  const normalize = (str) => str?.toLowerCase().trim() || "";
  const formatSlug = (name) => name?.toLowerCase().replace(/['’]/g, '-').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-') || "";

  const getUnitData = (rawName, allWarscrolls) => {
    if (!rawName) return null;
    let cleanName = typeof rawName === 'string' ? rawName.replace(/\s\(\d+.*pts\)$/i, "").trim() : rawName.name;
    const norm = normalize(cleanName);
    const match = allWarscrolls.find(ws => normalize(ws.name) === norm || normalize(ws.slug) === norm);
    return {
      displayName: match ? match.name : cleanName,
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

      const factionNorm = normalize(data.faction);
      const matchedKey = Object.keys(bannerMapping).find(key => factionNorm.includes(key)) || "slaves";
      const bannerFile = bannerMapping[matchedKey];

      // 1. Spell Lore
      const factionSpells = spellsIndex.factions?.[bannerFile] || {};
      const matchedLore = Object.keys(factionSpells).find(l => normalize(l) === normalize(data.spellLore));
      if (matchedLore) setActiveSpellLore(factionSpells[matchedLore]);

      // 2. Manifestations (LOGIQUE CORRIGÉE AVEC VALEURS DU JSON)
      const manifestationLoreName = data.manifestationLore;
      const mfs = [];
      
      // On prépare une liste plate de toutes les manifestations détaillées pour le lookup
      const allDetailed = [
        ...Object.values(manifestationsData.factions).flat(),
        // Pour les generics, on crée des objets simples si c'est juste une liste de noms
        ...Object.values(manifestationsData.generics).flat().map(n => typeof n === 'string' ? { name: n, castingValue: "7" } : n)
      ];

      const allowedNames = (manifestationsIndex.generics?.[manifestationLoreName] || []).map(n => normalize(n));
      const factionMfsNames = (manifestationsIndex.factions?.[bannerFile] || []).map(m => normalize(m.name || m));

      allWarscrolls.forEach(ws => {
        const normWSName = normalize(ws.name);
        if (ws.html?.toUpperCase().includes("MANIFESTATION")) {
          if (allowedNames.includes(normWSName) || factionMfsNames.includes(normWSName)) {
            // On cherche la castingValue dans le JSON détaillé
            const detail = allDetailed.find(d => normalize(d.name) === normWSName);
            mfs.push({ 
              ...ws, 
              castingValue: detail ? detail.castingValue : "7" 
            });
          }
        }
      });
      setFactionManifestations(mfs);

      // 3. Unités compilées
      const regs = data.regiments || [];
      const compiledUnits = new Map();
      regs.forEach(reg => {
        const items = [reg.hero, ...(reg.units || [])].filter(Boolean);
        items.forEach(uName => {
          const uInfo = getUnitData(uName, allWarscrolls);
          if (uInfo && !compiledUnits.has(normalize(uInfo.displayName))) {
            compiledUnits.set(normalize(uInfo.displayName), uInfo);
          }
        });
      });
      setUniqueUnits(Array.from(compiledUnits.values()).sort((a,b) => a.displayName.localeCompare(b.displayName)));
    }
  }, [id]);

  const detectedTactics = useMemo(() => {
    if (!list) return [];
    const data = list.listData || list;
    return (battleTacticsData || []).filter(bt => 
      (data.battle_tactics || []).some(tName => normalize(tName) === normalize(bt.name))
    );
  }, [list]);

  if (!list) return <div className="p-5 text-center text-info font-monospace">CHARGEMENT DES DONNÉES...</div>;

  const displayData = list.listData || list;
  const allWarscrolls = Object.values(warscrollsData).flatMap(cat => Object.values(cat).flatMap(f => f));
  const factionNorm = normalize(displayData.faction);
  const matchedKey = Object.keys(bannerMapping).find(key => factionNorm.includes(key)) || "slaves";
  const banner = bannerMapping[matchedKey];

  return (
    <div className="container mt-3 pb-5 px-3 font-monospace">
      <div className="mb-3">
        <Link to="/my-lists" className="btn btn-sm btn-outline-secondary text-uppercase fw-bold border-opacity-25 py-1">
          <i className="bi bi-chevron-left me-1"></i> Retour
        </Link>
      </div>

      {/* HEADER */}
      <div className="bg-black border border-secondary border-opacity-25 mb-4 shadow-lg overflow-hidden">
        <div className="position-relative" style={{ height: '140px' }}>
          <div className="card-image-bg" style={{ 
            backgroundImage: `url("/img/banner_${banner}.webp")`, 
            position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 
          }}></div>
          <div className="position-relative z-2 p-3 d-flex flex-column h-100 justify-content-center">
            <span className="badge border border-warning text-warning align-self-start mb-2" style={{ fontSize: '0.6rem' }}>
              {displayData.faction?.toUpperCase()}
            </span>
            <h2 className="text-white fw-900 text-uppercase mb-1 shadow-text">{list.title || displayData.customTitle}</h2>
            <div className="text-white-50 small fw-bold">SUBFACTION: {displayData.subFaction}</div>
          </div>
        </div>
        <div className="bg-info text-black px-3 py-2 d-flex justify-content-between align-items-center">
          <span className="fw-900 small">ORDRE DE BATAILLE</span>
          <div className="d-flex align-items-baseline">
            <span className="fw-900 fs-4 me-1">{displayData.points || "0"}</span>
            <span className="fw-bold small">PTS</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="d-flex gap-2 mb-4">
        <button className={`flex-fill btn btn-sm rounded-0 fw-bold ${viewMode === 'regiments' ? 'btn-info text-black' : 'btn-outline-secondary text-white'}`} onClick={() => setViewMode("regiments")}>
          [ RÉGIMENTS ]
        </button>
        <button className={`flex-fill btn btn-sm rounded-0 fw-bold ${viewMode === 'compiled' ? 'btn-info text-black' : 'btn-outline-secondary text-white'}`} onClick={() => setViewMode("compiled")}>
          [ UNITÉS ]
        </button>
      </div>

      {/* LISTE RÉGIMENTS */}
      <div className="row g-3">
        {viewMode === "regiments" ? (
          (displayData.regiments || []).map((reg, rIdx) => (
            <div key={rIdx} className="col-12">
              <div className="bg-black border border-secondary border-opacity-25 p-3 position-relative shadow-sm">
                <div className="position-absolute top-0 start-0 bg-white text-black px-2 fw-bold" style={{ fontSize: '0.6rem' }}>
                  RÉGIMENT #{rIdx + 1}
                </div>
                <div className="mt-2">
                  {[reg.hero, ...(reg.units || [])].filter(Boolean).map((u, uIdx) => {
                    const uInfo = getUnitData(u, allWarscrolls);
                    if (!uInfo) return null;
                    const isHero = uIdx === 0;

                    return (
                      <div key={uIdx} className="py-2 border-bottom border-secondary border-opacity-10">
                        <Link to={`/my-lists/${list.id}/warscroll/${uInfo.slug}`} className="text-decoration-none d-flex justify-content-between align-items-center">
                          <span className={`fw-bold text-uppercase ${isHero ? 'text-info' : 'text-white-50'}`} style={{ fontSize: '0.85rem' }}>
                            {isHero ? <i className="bi bi-star-fill me-2"></i> : "-- "}{uInfo.displayName}
                          </span>
                          <i className="bi bi-chevron-right text-info small"></i>
                        </Link>
                        
                        {isHero && reg.heroOptions && reg.heroOptions.length > 0 && (
                          <div className="ms-3 mt-1 d-flex flex-wrap gap-3">
                            {reg.heroOptions.map((opt, oIdx) => (
                              <div key={oIdx} className="d-flex align-items-center text-warning" style={{ fontSize: '0.75rem' }}>
                                <i className={oIdx === 0 ? "bi bi-patch-check-fill me-1" : "bi bi-gem me-1"}></i>
                                <span className="text-uppercase fw-bold" style={{ fontStyle: 'italic' }}>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
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
              <Link to={`/my-lists/${list.id}/warscroll/${unit.slug}`} className="text-decoration-none bg-black border border-secondary border-opacity-25 p-3 d-flex justify-content-between align-items-center">
                <span className="fw-bold text-uppercase text-info" style={{ fontSize: '0.85rem' }}>{unit.displayName}</span>
                <i className="bi bi-chevron-right text-info small"></i>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* INFOS ADDITIONNELLES */}
      <div className="row g-3 mt-4">
        {/* TACTIQUES */}
        <div className="col-12 col-md-4">
           <div className="bg-black border border-danger border-opacity-25 h-100">
            <div className="bg-danger text-white p-1 px-3 fw-bold text-uppercase small">Battle Tactics</div>
            <div className="p-3">
              {detectedTactics.map((bt, idx) => (
                <div key={idx} className="text-white-50 small mb-2"><i className="bi bi-caret-right-fill text-danger me-2"></i>{bt.name}</div>
              ))}
            </div>
          </div>
        </div>

        {/* SORTS */}
        {activeSpellLore.length > 0 && (
          <div className="col-12 col-md-4">
            <div className="bg-black border border-primary border-opacity-25 h-100">
              <div className="bg-primary text-white p-1 px-3 fw-bold text-uppercase small">Spell Lore: {displayData.spellLore}</div>
              <div className="p-0">
                {activeSpellLore.map((spell, idx) => (
                  <div key={idx} className="d-flex justify-content-between p-2 px-3 border-bottom border-secondary border-opacity-10">
                    <span className="text-white small text-uppercase" style={{fontSize: '0.7rem'}}>{spell.name}</span>
                    <span className="text-primary fw-bold small">CV: {spell.castingValue}+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MANIFESTATIONS (CV DYNAMIQUE ICI) */}
        {factionManifestations.length > 0 && (
          <div className="col-12 col-md-4">
             <div className="bg-black border border-info border-opacity-25 h-100">
              <div className="bg-info text-black p-1 px-3 fw-bold text-uppercase small">Manifestations</div>
              <div className="p-0">
                {factionManifestations.map((m, idx) => (
                  <Link key={idx} className="text-decoration-none d-flex justify-content-between p-2 px-3 border-bottom border-secondary border-opacity-10" to={`/my-lists/${list.id}/warscroll/${formatSlug(m.name)}`}>
                    <span className="text-white small text-uppercase" style={{fontSize: '0.7rem'}}>{m.name}</span>
                    <span className="text-info fw-bold small">CV: {m.castingValue}+</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .fw-900 { font-weight: 900; }
        .shadow-text { text-shadow: 2px 2px 4px #000; }
      `}</style>
    </div>
  );
}