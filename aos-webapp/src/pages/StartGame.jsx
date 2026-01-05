import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import battleplansData from "../data/battleplans.json";

export default function StartGame() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState("saved");
  const [savedLists, setSavedLists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [importText, setImportText] = useState("");
  
  const [gameConfig, setGameConfig] = useState({
    listData: null,
    battleplan: null,
    gameName: `Battle - ${new Date().toLocaleDateString('fr-FR')}`
  });

  const bannerMapping = {
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

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    const sorted = saved.sort((a, b) => {
      const dateB = new Date(b.dateSaved || b.id);
      const dateA = new Date(a.dateSaved || a.id);
      return dateB - dateA;
    });
    setSavedLists(sorted);
  }, []);

  const filteredLists = useMemo(() => {
    return savedLists.filter(l => 
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.faction?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [savedLists, searchTerm]);

  // SÉPARATION DES BATTLEPLANS PAR TABLE
  const groupedBattleplans = useMemo(() => {
    const table1 = battleplansData.filter(p => p.info.includes("Table 1")).sort((a,b) => a.info.localeCompare(b.info));
    const table2 = battleplansData.filter(p => p.info.includes("Table 2")).sort((a,b) => a.info.localeCompare(b.info));
    return { table1, table2 };
  }, []);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

    const startGame = () => {
    const sessionData = {
        gameName: gameConfig.gameName,
        battleplan: gameConfig.battleplan,
        listData: gameConfig.listData // C'est ici que tes unités sont stockées
    };
    
    // On transforme l'objet en texte JSON pour le localStorage
    localStorage.setItem("active_game_session", JSON.stringify(sessionData));
    
    navigate(`/game/${Date.now()}`);
    };

  // Composant interne pour éviter la répétition du code des cartes
  const BattleplanCard = ({ plan }) => {
    const isSelected = gameConfig.battleplan?.id === plan.id;
    const match = plan.info.match(/Battleplan (\d+) \(Table (\d+)\)/);
    const tableLabel = match ? `Table ${match[2]}.${match[1]}` : plan.info;

    return (
      <div className="col-12 col-md-4">
        <div 
          className={`card my-2 bg-dark border-secondary cursor-pointer transition-all overflow-hidden position-relative plan-card ${isSelected ? 'border-warning selected' : 'border-opacity-10'}`} 
          onClick={() => setGameConfig({...gameConfig, battleplan: plan})} 
          style={{height: '80px'}}
        >
          <div className="plan-image-container">
              <img src={plan.image} alt="" className="plan-image-cover" />
              <div className="plan-overlay"></div>
          </div>
          <div className="card-body p-2 d-flex flex-column align-items-start justify-content-end text-start position-relative z-2 h-100">
            <div className={`fw-bold text-uppercase mb-0 ${isSelected ? 'text-warning' : 'text-white'}`} style={{fontSize: '0.75rem', textShadow: '1px 1px 3px #000'}}>{plan.name}</div>
            <div className="text-secondary fw-bold small" style={{fontSize: '0.6rem'}}>{tableLabel}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4 pb-5 text-white">
      {/* STEPS INDICATOR */}
      <div className="text-center mb-5">
        <h2 className="fw-bold text-uppercase mb-4 shadow-text">Préparation de Bataille</h2>
        <div className="d-flex justify-content-center align-items-center gap-2">
            <span className={`badge rounded-pill px-3 py-2 ${step === 1 ? 'bg-warning text-dark' : 'bg-dark border border-secondary text-secondary'}`}>1. Armée</span>
            <div className="step-line"></div>
            <span className={`badge rounded-pill px-3 py-2 ${step === 2 ? 'bg-warning text-dark' : 'bg-dark border border-secondary text-secondary'}`}>2. Scénario</span>
            <div className="step-line"></div>
            <span className={`badge rounded-pill px-3 py-2 ${step === 3 ? 'bg-warning text-dark' : 'bg-dark border border-secondary text-secondary'}`}>3. Lancement</span>
        </div>
      </div>

      {/* STEP 1: SÉLECTION ARMÉE */}
      {step === 1 && (
        <div className="animate__animated animate__fadeIn mx-auto" style={{maxWidth: '800px'}}>
          <div className="d-flex justify-content-center mb-4">
            <div className="btn-group shadow">
              <button className={`btn btn-sm ${activeTab === 'saved' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setActiveTab('saved')}>Mes Armées</button>
              <button className={`btn btn-sm ${activeTab === 'import' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setActiveTab('import')}>Import Direct</button>
            </div>
          </div>

          {activeTab === "saved" ? (
            <div className="card bg-dark border-secondary p-3 shadow-lg border-opacity-25">
              <input type="text" className="form-control bg-black text-white border-secondary mb-3" placeholder="Rechercher une armée..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="list-group custom-scrollbar" style={{maxHeight: '400px', overflowY: 'auto'}}>
                {filteredLists.map(list => {
                  const banner = bannerMapping[list.faction] || "default";
                  const isSelected = gameConfig.listData?.id === list.id;
                  return (
                    <button key={list.id} onClick={() => setGameConfig({...gameConfig, listData: list})} className={`list-group-item bg-black border-secondary mb-2 rounded d-flex align-items-center p-0 overflow-hidden transition-all ${isSelected ? 'border-info ring-active' : 'text-white border-opacity-10'}`}>
                      <img src={`/img/banner_${banner}.webp`} style={{width: '70px', height: '55px', objectFit: 'cover', opacity: isSelected ? 1 : 0.7}} alt="" />
                      <div className="ms-3 text-start flex-grow-1">
                        <div className="fw-bold small text-uppercase">{list.faction}</div>
                        <div className="text-secondary" style={{fontSize: '0.75rem'}}>{list.name} <span className="opacity-50">— {new Date(list.dateSaved || list.id).toLocaleDateString()}</span></div>
                      </div>
                      {isSelected && <span className="me-3 text-info">✔</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card bg-dark border-secondary p-4 text-center">
              <textarea className="form-control bg-black text-white border-secondary mb-3" rows="6" placeholder="Collez votre texte de liste ici..." value={importText} onChange={(e) => setImportText(e.target.value)} />
              <button className="btn btn-outline-info" onClick={() => setGameConfig({...gameConfig, listData: {id: Date.now(), name: "Import", faction: "Unknown", regiments: []}})}>Charger</button>
            </div>
          )}

          {gameConfig.listData && <button className="btn btn-warning w-100 py-3 fw-bold mt-4 shadow" onClick={nextStep}>VALIDER L'ARMÉE</button>}
        </div>
      )}

      {/* STEP 2: SÉLECTION SCÉNARIO SEGMENTÉE */}
      {step === 2 && (
        <div className="animate__animated animate__fadeIn mx-auto" style={{maxWidth: '1200px'}}>
          <div className="overflow-auto pe-2 custom-scrollbar" style={{maxHeight: '65vh'}}>
            
            {/* SECTION TABLE 1 */}
            <h5 className="text-info text-uppercase fw-bold mb-3 border-start border-info border-4 ps-2" style={{letterSpacing: '1px'}}>Table 1 - Battleplans</h5>
            <div className="row g-2 mb-5">
              {groupedBattleplans.table1.map(plan => (
                <BattleplanCard key={plan.id} plan={plan} />
              ))}
            </div>

            {/* SECTION TABLE 2 */}
            <h5 className="text-info text-uppercase fw-bold mb-3 border-start border-info border-4 ps-2" style={{letterSpacing: '1px'}}>Table 2 - Battleplans</h5>
            <div className="row g-2 mb-3">
              {groupedBattleplans.table2.map(plan => (
                <BattleplanCard key={plan.id} plan={plan} />
              ))}
            </div>

          </div>
          <div className="d-flex justify-content-center gap-2 mt-4">
            <button className="btn btn-outline-secondary px-4" onClick={prevStep}>Retour</button>
            <button className="btn btn-warning px-5 py-3 fw-bold shadow" disabled={!gameConfig.battleplan} onClick={nextStep}>SUIVANT</button>
          </div>
        </div>
      )}

      {/* STEP 3: RÉSUMÉ & LANCEMENT */}
      {step === 3 && (
        <div className="animate__animated animate__zoomIn mx-auto" style={{maxWidth:'550px'}}>
           
           {/* NOM DE PARTIE EDITABLE */}
           <div className="mb-5 text-center">
              <label className="text-secondary small fw-bold text-uppercase mb-2">Nom de la session (cliquez pour modifier)</label>
              <div className="position-relative edit-name-container">
                <input 
                    type="text" 
                    className="form-control form-control-lg bg-dark text-white text-center border-warning border-opacity-50 fw-bold shadow-lg py-3" 
                    value={gameConfig.gameName} 
                    onChange={(e) => setGameConfig({...gameConfig, gameName: e.target.value})} 
                    style={{fontSize: '1.4rem'}} 
                />
                <span className="position-absolute top-50 end-0 translate-middle-y me-3 text-warning opacity-50 fs-2">✎</span>
              </div>
           </div>

           {/* RÉSUMÉ VISUEL */}
           <div className="row g-4 mb-5">
              <div className="col-12 text-start">
                <h6 className="text-primary text-uppercase fw-bold mb-2" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>Armée engagée</h6>
                <div className="card bg-dark border-secondary overflow-hidden position-relative shadow-sm" style={{height: '100px'}}>
                  <img src={`/img/banner_${bannerMapping[gameConfig.listData.faction] || 'default'}.webp`} className="position-absolute w-100 h-100 opacity-25" style={{objectFit: 'cover', left: 0, top: 0}} alt="" />
                  <div className="card-body position-relative z-2 d-flex align-items-center h-100">
                    <div>
                      <h4 className="mb-1 fw-bold text-white text-uppercase" style={{letterSpacing: '1px'}}>
                        {gameConfig.listData.faction}
                      </h4>
                      {gameConfig.listData.subFaction && gameConfig.listData.subFaction !== "Inconnue" && (
                        <span className="badge bg-primary text-uppercase" style={{fontSize: '0.65rem'}}>
                          {gameConfig.listData.subFaction}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 text-start">
                <h6 className="text-warning text-uppercase fw-bold mb-2" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>Champ de bataille</h6>
                <div className="card bg-dark border-secondary overflow-hidden position-relative shadow-sm" style={{height: '100px'}}>
                  <img src={gameConfig.battleplan.image} className="position-absolute w-100 h-100 opacity-25" style={{objectFit: 'cover', left: 0, top: 0}} alt="" />
                  <div className="card-body position-relative z-2 d-flex align-items-center h-100">
                    <div>
                      <h4 className="mb-1 fw-bold text-warning text-uppercase" style={{letterSpacing: '1px'}}>
                        {gameConfig.battleplan.name}
                      </h4>
                      <div className="text-white small fw-bold">
                        {gameConfig.battleplan.info}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary w-25 py-3 fw-bold" onClick={prevStep}>RETOUR</button>
              <button className="btn btn-warning w-75 py-3 fw-bold text-dark shadow-lg fs-5" onClick={startGame}>DÉPLOYER L'OST ⚔️</button>
           </div>
        </div>
      )}

      <style>{`
        .step-line { width: 30px; height: 2px; background: #333; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
        .plan-card { background: #111 !important; border-radius: 12px !important; }
        .plan-image-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .plan-image-cover { width: 100%; height: 100%; object-fit: cover; opacity: 0.35; transition: 0.3s; }
        .plan-card.selected .plan-image-cover { opacity: 1; }
        .plan-overlay { position: absolute; bottom: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%); }
        .ring-active { border-color: #0dcaf0 !important; }
        .edit-name-container input:focus { border-color: #ffc107 !important; box-shadow: 0 0 20px rgba(255, 193, 7, 0.2); outline: none; }
        .shadow-text { text-shadow: 2px 2px 10px #000; }
        .plan-card.selected { border-width: 2px !important; box-shadow: 0 0 15px rgba(255, 193, 7, 0.7); }
      `}</style>
    </div>
  );
}