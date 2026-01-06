import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Données
import { battleplansData } from "../data/battleplansData";
import battleTacticsData from "../data/battletactics.json";
import formationsData from "../data/formations_map.json";

const allianceImages = {
  ORDER: "/factions/order/order.jpg",
  CHAOS: "/factions/chaos/chaos.jpg",
  DEATH: "/factions/death/death.jpg",
  DESTRUCTION: "/factions/destruction/destruction.jpg"
};

const factionDataMap = {
  ORDER: [
    { name: "Stormcast Eternals", slug: "stormcast", img: "banner_stormcast.webp" },
    { name: "Seraphon", slug: "seraphon", img: "banner_seraphon.webp" },
    { name: "Cities of Sigmar", slug: "citiesofsigmar", img: "banner_citiesofsigmar.webp" },
    { name: "Sylvaneth", slug: "sylvaneth", img: "banner_sylvaneth.webp" },
    { name: "Idoneth Deepkin", slug: "idoneth", img: "banner_idoneth.webp" },
    { name: "Lumineth Realm-lords", slug: "lumineth", img: "banner_lumineth.webp" },
    { name: "Fyreslayers", slug: "fyreslayers", img: "banner_fyreslayers.webp" },
    { name: "Daughters of Khaine", slug: "daughtersofkhaine", img: "banner_daughtersofkhaine.webp" },
    { name: "Kharadron Overlords", slug: "kharadron", img: "banner_kharadron.webp" }
  ],
  CHAOS: [
    { name: "Blades of Khorne", slug: "khorne", img: "banner_khorne.webp" },
    { name: "Disciples of Tzeentch", slug: "tzeentch", img: "banner_tzeentch.webp" },
    { name: "Maggotkin of Nurgle", slug: "nurgle", img: "banner_nurgle.webp" },
    { name: "Hedonites of Slaanesh", slug: "slaanesh", img: "banner_slaanesh.webp" },
    { name: "Skaven", slug: "skaven", img: "banner_skaven.webp" },
    { name: "Slaves to Darkness", slug: "slaves", img: "banner_slaves.webp" }
  ],
  DEATH: [
    { name: "Ossiarch Bonereapers", slug: "ossiarch", img: "banner_ossiarch.webp" },
    { name: "Soulblight Gravelords", slug: "soulblight", img: "banner_soulblight.webp" },
    { name: "Flesh-eater Courts", slug: "flesheater", img: "banner_flesheater.webp" },
    { name: "Nighthaunt", slug: "nighthaunt", img: "banner_nighthaunt.webp" }
  ],
  DESTRUCTION: [
    { name: "Ironjawz", slug: "ironjawz", img: "banner_ironjawz.webp" },
    { name: "Kruleboyz", slug: "kruleboyz", img: "banner_kruleboyz.webp" },
    { name: "Gloomspite Gitz", slug: "gloomspite", img: "banner_gloomspite.webp" },
    { name: "Ogor Mawtribes", slug: "ogor", img: "banner_ogor.webp" },
    { name: "Sons of Behemat", slug: "sonsofbehemat", img: "banner_sonsofbehemat.webp" }
  ]
};

export default function StartGame() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [armyModal, setArmyModal] = useState({ show: false, player: null, view: 'saved' });
  const [tacticModal, setTacticModal] = useState({ show: false, player: null, tempSelection: [] });
  const [savedLists, setSavedLists] = useState([]);

  const [setup, setSetup] = useState({
    you: { faction: "", slug: "", subFaction: "", tactics: [], fullData: null },
    opp: { faction: "", slug: "", subFaction: "", tactics: [], fullData: null },
    battleplan: null
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    setSavedLists(saved);
  }, [armyModal.show]);

  const findSlugByName = (name) => {
    if (!name) return "";
    for (const alliance in factionDataMap) {
      const found = factionDataMap[alliance].find(f => f.name.toLowerCase() === name.toLowerCase());
      if (found) return found.slug;
    }
    return "";
  };

  const getFactionImage = (slug) => {
    if (!slug) return null;
    for (const alliance in factionDataMap) {
      const found = factionDataMap[alliance].find(f => f.slug === slug);
      if (found) return `/img/${found.img}`;
    }
    return null;
  };

  const selectArmySaved = (player, list) => {
    const data = list.listData || list;
    const fName = list.faction || data.faction || "";
    const slug = findSlugByName(fName);
    const sub = data.subFaction || data.formation || data.battle_formation || "";
    
    // Logique Battle Tactics améliorée
    const rawTactics = data.battle_tactics || data.tactics || [];
    let detectedTactics = [];

    if (Array.isArray(rawTactics)) {
      detectedTactics = rawTactics
        .map(importedValue => {
          const searchString = importedValue.toString().toLowerCase().trim();
          const match = battleTacticsData.find(bt => 
            bt.name.toLowerCase().trim() === searchString || 
            bt.rulesTable.toLowerCase().includes(`> ${searchString.toUpperCase()}<`) ||
            bt.rulesTable.toLowerCase().includes(`<b>${searchString.toUpperCase()}</b>`)
          );
          return match ? match.id : null;
        })
        .filter(id => id !== null);
    }

    setSetup(prev => ({ 
      ...prev, 
      [player]: { 
        ...prev[player], 
        faction: list.title || fName, 
        slug: slug, 
        subFaction: sub,
        tactics: detectedTactics.length >= 2 ? detectedTactics.slice(0, 2) : prev[player].tactics,
        fullData: list
      } 
    }));
    setArmyModal({ show: false, player: null, view: 'saved' });
  };

  const selectArmyBasic = (player, factionName, slug) => {
    setSetup(prev => ({ 
      ...prev, 
      [player]: { ...prev[player], faction: factionName, slug: slug, subFaction: "", tactics: [], fullData: null } 
    }));
    setArmyModal({ show: false, player: null, view: 'saved' });
  };

  const isStep1Valid = () => {
    return setup.you.faction && setup.you.subFaction && setup.you.tactics.length === 2 && 
           setup.opp.faction && setup.opp.subFaction && setup.opp.tactics.length === 2;
  };

  const toggleTempTactic = (id) => {
    setTacticModal(prev => {
      const isSelected = prev.tempSelection.includes(id);
      if (isSelected) return { ...prev, tempSelection: prev.tempSelection.filter(t => t !== id) };
      if (prev.tempSelection.length < 2) return { ...prev, tempSelection: [...prev.tempSelection, id] };
      return prev;
    });
  };

  const confirmTactics = () => {
    setSetup(prev => ({ ...prev, [tacticModal.player]: { ...prev[tacticModal.player], tactics: tacticModal.tempSelection } }));
    setTacticModal({ show: false, player: null, tempSelection: [] });
  };

  return (
    <div className="min-vh-100 bg-black text-white p-3 font-monospace">
      <style>{`
        .btn-selected-army { background-size: cover !important; background-position: center 20% !important; position: relative; overflow: hidden; border: 1px solid #0dcaf0 !important; height: 80px; }
        .btn-selected-army::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%); z-index: 0; }
        .custom-select { background: #111; color: #fff; border: 1px solid #333; border-radius: 10px; padding: 12px; width: 100%; outline: none; border-left: 4px solid #0dcaf0; }
        .faction-card { height: 70px; border: 1px solid rgba(255, 255, 255, 0.1) !important; position: relative; overflow: hidden; background: #111; width: 100%; text-align: left; margin-bottom: 8px; border-radius: 12px; }
        .faction-img-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center 20%; filter: brightness(0.3); z-index: 1; }
        .faction-text { position: relative; z-index: 3; padding-left: 15px; font-weight: bold; text-transform: uppercase; color: white; font-size: 0.85rem; }
        .alliance-header-btn { background-size: cover !important; background-position: center !important; height: 80px; color: white !important; font-weight: 900 !important; text-shadow: 0px 2px 10px rgba(0,0,0,1); text-transform: uppercase; position: relative; }
        .nav-tabs-custom { border-bottom: 2px solid #222; margin-bottom: 20px; }
        .nav-tabs-custom .nav-link { color: #555; border: none; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; padding-bottom: 10px; border-radius: 0; }
        .nav-tabs-custom .nav-link.active { color: #0dcaf0; border-bottom: 2px solid #0dcaf0; background: transparent; }
        .saved-list-card { background: #111; border: 1px solid #333; border-radius: 12px; margin-bottom: 10px; overflow: hidden; position: relative; height: 70px; width: 100%; text-align: left; transition: transform 0.1s; }
        .saved-list-card:active { transform: scale(0.98); }
        .saved-list-card-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center 20%; filter: brightness(0.25); z-index: 1; }
        .saved-list-content { position: relative; z-index: 2; padding: 10px 15px; height: 100%; display: flex; flex-direction: column; justify-content: center; }
      `}</style>

      {/* PROGRESSION */}
      <div className="d-flex align-items-center mb-4 pt-2 px-2">
        {step > 1 && <button className="btn btn-sm text-warning p-0 me-3 fw-bold" onClick={() => setStep(step-1)}>← RETOUR</button>}
        <div className="flex-grow-1 d-flex gap-1" style={{height: '4px'}}>
          {[1,2,3].map(i => <div key={i} className={`flex-grow-1 rounded ${step >= i ? 'bg-warning' : 'bg-secondary opacity-25'}`} />)}
        </div>
      </div>

      {step === 1 && (
        <div className="animate__animated animate__fadeIn">
          <h4 className="text-gold text-center small-caps mb-4 fw-bold">Nouveau Match</h4>
          {["you", "opp"].map(pKey => {
            const selectedImg = getFactionImage(setup[pKey].slug);
            const formations = formationsData[setup[pKey].slug] || [];

            return (
              <div key={pKey} className="bg-dark bg-opacity-50 p-3 rounded-4 border border-secondary border-opacity-25 mb-3 position-relative">
                {setup[pKey].fullData && (
                    <span className="position-absolute top-0 end-0 m-2 badge bg-info text-dark" style={{fontSize:'0.5rem'}}>IMPORTÉE</span>
                )}
                <h6 className="text-gold small-caps fw-bold mb-3" style={{fontSize: '0.7rem'}}>{pKey === "you" ? "VOTRE ARMÉE" : "ADVERSAIRE"}</h6>
                
                <button 
                  className={`btn w-100 mb-3 py-3 text-start border d-flex align-items-center ${setup[pKey].faction ? 'btn-selected-army' : 'btn-outline-secondary opacity-75'}`}
                  style={setup[pKey].slug ? { backgroundImage: `url(${selectedImg})` } : {}}
                  onClick={() => setArmyModal({ show: true, player: pKey, view: 'saved' })}
                >
                  <div className="position-relative z-1">
                    <small className="d-block text-secondary opacity-75" style={{fontSize: '0.6rem'}}>LISTE / FACTION</small>
                    <span className={setup[pKey].faction ? "text-info fw-bold text-uppercase" : ""}>{setup[pKey].faction || "Choisir..."}</span>
                  </div>
                </button>

                {setup[pKey].faction && (
                  <div className="mb-3">
                    <small className="text-secondary d-block mb-1" style={{fontSize: '0.6rem'}}>BATTLE FORMATION</small>
                    <select className="custom-select" value={setup[pKey].subFaction} onChange={(e) => setSetup({...setup, [pKey]:{...setup[pKey], subFaction: e.target.value}})}>
                      <option value="">-- Sélectionner --</option>
                      {setup[pKey].subFaction && !formations.includes(setup[pKey].subFaction) && (
                          <option value={setup[pKey].subFaction}>{setup[pKey].subFaction}</option>
                      )}
                      {formations.map((name, idx) => (
                        <option key={idx} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button className={`btn w-100 py-3 text-start border ${setup[pKey].tactics.length === 2 ? 'border-success bg-black shadow-sm' : 'btn-outline-secondary opacity-75'}`}
                  onClick={() => setTacticModal({ show: true, player: pKey, tempSelection: setup[pKey].tactics })}>
                  <small className="d-block text-secondary opacity-75" style={{fontSize: '0.6rem'}}>TACTIQUES</small>
                  <span className={setup[pKey].tactics.length === 2 ? "text-success small fw-bold" : ""}>
                    {setup[pKey].tactics.length === 2 
                      ? setup[pKey].tactics.map(id => battleTacticsData.find(t=>t.id===id)?.name).join(' & ') 
                      : "Sélectionner 2..."}
                  </span>
                </button>
              </div>
            );
          })}
          <button className="btn btn-warning w-100 py-3 mt-4 rounded-pill fw-bold text-dark shadow" disabled={!isStep1Valid()} onClick={() => setStep(2)}>SUIVANT</button>
        </div>
      )}

      {/* MODAL ARMÉE AMÉLIORÉE */}
      {armyModal.show && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1060}}>
          <div className="modal-dialog modal-dialog-centered modal-lg p-2">
            <div className="modal-content bg-black border border-info border-opacity-50 rounded-4 overflow-hidden">
              <div className="p-3 pb-0">
                <div className="nav nav-tabs nav-tabs-custom">
                   <button className={`nav-link flex-grow-1 ${armyModal.view === 'saved' ? 'active' : ''}`} onClick={() => setArmyModal({...armyModal, view: 'saved'})}>Sauvegardées</button>
                   <button className={`nav-link flex-grow-1 ${armyModal.view === 'basic' ? 'active' : ''}`} onClick={() => setArmyModal({...armyModal, view: 'basic'})}>Factions</button>
                </div>
              </div>

              <div className="modal-body p-3 overflow-auto" style={{maxHeight: '65vh'}}>
                {armyModal.view === 'saved' ? (
                  <div className="animate__animated animate__fadeIn">
                    {savedLists.length === 0 ? <div className="text-center py-5 text-secondary">Aucune liste...</div> : 
                      savedLists.map((list) => {
                        const data = list.listData || list;
                        const factionName = list.faction || data.faction || "";
                        const subName = data.subFaction || data.formation || data.battle_formation || "";
                        const slug = findSlugByName(factionName);
                        const img = getFactionImage(slug);

                        return (
                          <button key={list.id} className="saved-list-card" onClick={() => selectArmySaved(armyModal.player, list)}>
                            <div className="saved-list-card-bg" style={{ backgroundImage: `url(${img})` }}></div>
                            <div className="saved-list-content">
                                <div className="text-white fw-bold text-uppercase text-truncate" style={{fontSize:'0.85rem'}}>{list.title}</div>
                                <div className="small d-flex align-items-center text-truncate">
                                    <span className="text-info fw-bold me-2 text-truncate">{factionName}</span>
                                    {subName && <span className="text-white-50 text-truncate">— {subName}</span>}
                                </div>
                            </div>
                          </button>
                        );
                      })
                    }
                  </div>
                ) : (
                  <div className="accordion accordion-flush" id="fAcc">
                    {Object.entries(factionDataMap).map(([alliance, factions], idx) => (
                      <div className="accordion-item bg-transparent border-bottom border-secondary border-opacity-25" key={alliance}>
                        <h2 className="accordion-header">
                          <button className="accordion-button collapsed alliance-header-btn shadow-none" type="button" data-bs-toggle="collapse" data-bs-target={`#cF${idx}`} style={{ backgroundImage: `url(${allianceImages[alliance]})` }}>
                                <span>{alliance}</span>
                          </button>
                        </h2>
                        <div id={`cF${idx}`} className="accordion-collapse collapse" data-bs-parent="#fAcc">
                          <div className="accordion-body p-2 d-flex flex-column">
                            {factions.map(f => (
                              <button key={f.slug} className="faction-card" onClick={() => selectArmyBasic(armyModal.player, f.name, f.slug)}>
                                <div className="faction-img-bg" style={{ backgroundImage: `url(/img/${f.img})` }}></div>
                                <div className="faction-text">{f.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3"><button className="btn btn-outline-light w-100 fw-bold rounded-pill" onClick={() => setArmyModal({show:false})}>FERMER</button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TACTIQUES */}
      {tacticModal.show && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060}}>
          <div className="modal-dialog modal-dialog-centered p-2">
            <div className="modal-content bg-dark border border-info shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-secondary">
                <h6 className="text-info mb-0 fw-bold">Tactiques ({tacticModal.tempSelection.length}/2)</h6>
              </div>
              <div className="modal-body py-3 overflow-auto" style={{maxHeight: '60vh'}}>
                <div className="d-flex flex-column gap-2">
                  {battleTacticsData.map(bt => (
                    <button key={bt.id} className={`btn py-3 text-start border rounded-3 transition-all ${tacticModal.tempSelection.includes(bt.id) ? 'btn-info text-dark fw-bold border-info' : 'btn-outline-secondary text-white opacity-75'}`} onClick={() => toggleTempTactic(bt.id)}>{bt.name}</button>
                  ))}
                </div>
              </div>
              <div className="modal-footer border-0 d-flex gap-2 p-3">
                <button className="btn btn-outline-light flex-grow-1" onClick={() => setTacticModal({show:false, player:null, tempSelection:[]})}>ANNULER</button>
                <button className="btn btn-info flex-grow-1 text-dark fw-bold" disabled={tacticModal.tempSelection.length !== 2} onClick={confirmTactics}>VALIDER</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPES 2 & 3 */}
      {step === 2 && (
        <div className="animate__animated animate__fadeIn">
          <h4 className="text-gold text-center small-caps mb-4 fw-bold">Scénario</h4>
          <div className="d-flex flex-column gap-2">
            {Object.keys(battleplansData["Passing Seasons"] || {}).map(name => (
              <button key={name} className={`btn py-3 text-start border rounded-3 ${setup.battleplan?.name === name ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-white'}`}
                onClick={() => setSetup({...setup, battleplan: {name, ...battleplansData["Passing Seasons"][name]}})}>{name}</button>
            ))}
          </div>
          <button className="btn btn-warning w-100 py-3 mt-5 rounded-pill fw-bold text-dark" disabled={!setup.battleplan} onClick={() => setStep(3)}>RÉCAPITULATIF</button>
        </div>
      )}

      {step === 3 && (
        <div className="animate__animated animate__fadeIn">
          <h4 className="text-gold text-center small-caps mb-4 fw-bold">Prêt pour la bataille ?</h4>
          <div className="bg-dark border border-secondary p-4 rounded-4 mb-4 text-center">
            <div className="row g-0 align-items-center">
              <div className="col-5">
                <div className="text-info fw-bold">{setup.you.faction}</div>
                <div className="small text-secondary text-truncate">{setup.you.subFaction}</div>
              </div>
              <div className="col-2 text-warning fw-bold h4">VS</div>
              <div className="col-5">
                <div className="text-danger fw-bold">{setup.opp.faction}</div>
                <div className="small text-secondary text-truncate">{setup.opp.subFaction}</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-top border-secondary text-gold small fw-bold">{setup.battleplan?.name}</div>
          </div>
          <button className="btn btn-warning w-100 py-3 rounded-pill fw-bold text-dark shadow-lg" onClick={() => {
            localStorage.setItem("active_game_session", JSON.stringify(setup));
            navigate("/game");
          }}>LANCER LA PARTIE</button>
        </div>
      )}
    </div>
  );
}