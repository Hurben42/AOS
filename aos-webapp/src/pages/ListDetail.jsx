import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import manifestationsDetailed from "../data/manifestations_detailed.json";
import spellsIndex from "../data/spellsIndex.json";

export default function ListDetail() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [activeSpells, setActiveSpells] = useState([]);
  const [activeManifestations, setActiveManifestations] = useState([]);
  const [battleTactics, setBattleTactics] = useState([]);
  const [viewMode, setViewMode] = useState("regiments");
  const [uniqueUnits, setUniqueUnits] = useState([]);

  const factionDataKeyMap = {
    "soulblight gravelords": "soulblight", "ossiarch bonereapers": "ossiarch",
    "nighthaunt": "nighthaunt", "skaven": "skaven", "stormcast eternals": "stormcast",
    "flesh-eater courts": "flesheater", "nurgle": "nurgle", "ironjawz": "ironjawz",
    "gloomspite gitz": "gloomspite", "kruleboyz": "kruleboyz"
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    const found = saved.find(l => l.id === id);
    if (found) {
      setList(found);
      const factionLower = found.faction.toLowerCase();
      const dataKey = Object.keys(factionDataKeyMap).find(k => factionLower.includes(k)) 
                      ? factionDataKeyMap[Object.keys(factionDataKeyMap).find(k => factionLower.includes(k))] 
                      : "slaves";

      // Préparation de la vue par unités
      const uMap = new Map();
      found.regiments.forEach(r => {
        if (r.hero) uMap.set(r.hero, "HERO");
        r.units.forEach(u => uMap.set(u.name, u.type || "UNIT"));
      });
      setUniqueUnits(Array.from(uMap.entries()).map(([name, type]) => ({ name, type })));

      // Sorts
      const loreSpells = spellsIndex.factions?.[dataKey] || {};
      const loreKey = Object.keys(loreSpells).find(k => k.toLowerCase() === found.spellLore.toLowerCase());
      if (loreKey) setActiveSpells(loreSpells[loreKey]);

      // Manifestations
      const mNames = manifestationsDetailed.generics?.[found.manifestationLore] || [];
      const mDetailed = manifestationsDetailed.factions?.[dataKey] || [];
      setActiveManifestations(mNames.map(n => ({
        name: n, castingValue: mDetailed.find(x => x.name === n)?.castingValue || "7",
      })));

      // Tactics
      setBattleTactics(found.battletactics || []);
    }
  }, [id]);

  if (!list) return null;
  const formatSlug = (n) => n.toLowerCase().replace(/ /g, "-").replace(/['’]/g, "").replace(/,/g, "");
  const banner = `/img/banner_${list.faction.toLowerCase().replace(/\s+/g, '')}.webp`;

  return (
    <div className="min-h-screen bg-black pb-5 font-monospace text-start">
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
        {/* TABS POUR DOUBLE VUE */}
        <div className="d-flex bg-dark p-1 mb-4 border border-secondary border-opacity-25" style={{maxWidth: '400px'}}>
          <button onClick={() => setViewMode("regiments")} className={`flex-grow-1 btn btn-sm rounded-0 fw-bold transition ${viewMode === 'regiments' ? 'btn-info text-black' : 'text-secondary hover-white'}`}>[ RÉGIMENTS ]</button>
          <button onClick={() => setViewMode("units")} className={`flex-grow-1 btn btn-sm rounded-0 fw-bold transition ${viewMode === 'units' ? 'btn-info text-black' : 'text-secondary hover-white'}`}>[ UNITÉS ]</button>
        </div>

        <div className="row g-4">
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
                          <div className="text-info tiny fw-bold opacity-75">{reg.heroOptions.join(" • ")}</div>
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

          <div className="col-lg-4">
            {/* BATTLE TACTICS RESTAUREES */}
            <div className="bg-dark bg-opacity-30 border border-danger border-opacity-25 p-4 shadow-lg text-white mb-4">
              <div className="d-flex justify-content-between border-bottom border-danger border-opacity-50 pb-2 mb-3">
                <h6 className="text-danger fw-bold text-uppercase m-0 small">Battle Tactics</h6>
                <span className="badge bg-danger text-black tiny fw-bold rounded-0">LIVE</span>
              </div>
              {battleTactics.map((t, i) => (
                <div key={i} className="d-flex align-items-start gap-3 mb-3 p-2 border border-secondary border-opacity-10 hover-tactic transition cursor-pointer" onClick={e => e.currentTarget.classList.toggle('tactic-checked')}>
                  <div className="tactic-checkbox mt-1"></div>
                  <div className="tiny fw-bold uppercase text-white opacity-75">{t}</div>
                </div>
              ))}
            </div>

            {/* ARMY LORE REDESIGN */}
            <div className="bg-dark bg-opacity-30 border border-success border-opacity-25 p-4 shadow-lg text-white mb-4">
              <div className="d-flex justify-content-between align-items-center border-bottom border-success border-opacity-50 pb-2 mb-3">
                <h6 className="text-success fw-bold text-uppercase m-0 small">Army Lore</h6>
                <span className="badge bg-success text-black tiny fw-bold rounded-0">DATA</span>
              </div>
              <div className="mb-3">
                <div className="tiny fw-bold text-success text-uppercase opacity-75 mb-1" style={{fontSize: '0.6rem'}}>Spell Lore</div>
                <div className="p-2 border border-secondary border-opacity-10 small fw-bold uppercase">{list.spellLore}</div>
              </div>
              <div className="mb-3">
                <div className="tiny fw-bold text-success text-uppercase opacity-75 mb-1" style={{fontSize: '0.6rem'}}>Manifestations</div>
                <div className="p-2 border border-secondary border-opacity-10 small">
                  <div className="fw-bold uppercase mb-1">{list.manifestationLore}</div>
                  {activeManifestations.map((m, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center text-white-50 tiny mb-1">
                      <span className="uppercase">• {m.name}</span>
                      <span className="text-success fw-bold">{m.castingValue}+</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="tiny fw-bold text-success text-uppercase opacity-75 mb-1" style={{fontSize: '0.6rem'}}>Terrain</div>
                <div className="p-2 border border-secondary border-opacity-10 small fw-bold uppercase">{list.factionTerrain}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .fw-900 { font-weight: 900; } .shadow-text { text-shadow: 2px 2px 8px rgba(0,0,0,0.8); } .tiny { font-size: 0.65rem; } 
        .uppercase { text-transform: uppercase; } .transition { transition: all 0.2s; }
        .hover-info:hover { color: #0dcaf0 !important; cursor: pointer; }
        .tactic-checkbox { width: 14px; height: 14px; border: 1px solid #ff0739; flex-shrink: 0; }
        .tactic-checked .tactic-checkbox { background-color: #ff0739; box-shadow: 0 0 8px #ff0739; }
        .tactic-checked .tiny { color: #ff0739 !important; text-decoration: line-through; opacity: 0.4; }
        .hover-tactic:hover { background: rgba(255, 7, 7, 0.05); }
      `}</style>
    </div>
  );
}