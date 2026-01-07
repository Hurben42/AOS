import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [savedGames, setSavedGames] = useState(() => {
    const saved = localStorage.getItem("saved_games");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedGame, setSelectedGame] = useState(null);

  const bannerMapping = {
    "soulblight gravelords": "soulblight", "stormcast eternals": "stormcast",
    "slaves to darkness": "slaves", "ossiarch bonereapers": "ossiarch",
    "nighthaunt": "nighthaunt", "flesh-eater courts": "flesheater",
    "cities of sigmar": "citiesofsigmar", "daughters of khaine": "daughtersofkhaine",
    "fyreslayers": "fyreslayers", "gloomspite gitz": "gloomspite",
    "idoneth deepkin": "idoneth", "ironjawz": "ironjawz",
    "kharadron overlords": "kharadron", "blades of khorne": "khorne",
    "kruleboyz": "kruleboyz", "lumineth realm-lords": "lumineth",
    "maggotkin of nurgle": "nurgle", "ogor mawtribes": "ogor",
    "seraphon": "seraphon", "skaven": "skaven", "hedonites of slaanesh": "slaanesh",
    "sons of behemat": "sonsofbehemat", "sylvaneth": "sylvaneth", "disciples of tzeentch": "tzeentch"
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const deleteGame = (e, date) => {
    e.stopPropagation(); 
    if (window.confirm("Supprimer ce rapport de bataille ?")) {
      const updated = savedGames.filter(g => g.date !== date);
      localStorage.setItem("saved_games", JSON.stringify(updated));
      setSavedGames(updated);
    }
  };

  const getTotal = (history, player) => {
    return history.reduce((acc, round) => acc + (player === 'you' ? round.youTotal : round.oppTotal), 0);
  };

  return (
    <div className="container mt-4 pb-5 px-3 font-monospace">
      <style>{`
        .history-card { 
            background: #111; border-radius: 15px; overflow: hidden; 
            border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s;
        }
        .history-card:active { transform: scale(0.98); }
        .history-banner-box { height: 75px; display: flex; position: relative; }
        .banner-half { width: 50%; height: 100%; background-size: cover; background-position: center; opacity: 0.5; }
        
        .modal-recap-overlay {
          position: fixed; inset: 0; background: #000; z-index: 10000;
          overflow-y: auto; padding: 15px; color: white;
        }
        .winner-card-mini { 
          position: relative; height: 110px; background-size: cover; background-position: center;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          border: 1px solid #000; overflow: hidden; border-radius: 12px;
        }
        .card-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%); z-index: 1; }
        .card-content { position: relative; z-index: 2; }
        
        .table-score { width: 100%; border-collapse: separate; border-spacing: 0 4px; font-size: 0.75rem; }
        .table-score td { background: #111; padding: 12px 8px; vertical-align: middle; border-bottom: 1px solid #222; }
        .td-round { border-left: 3px solid #ffc107; font-weight: bold; color: #ffc107; width: 45px; text-align: center; }
        .score-pill { background: #333; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
        .tactic-success-text { font-size: 0.65rem; font-style: italic; font-weight: bold; color: #198754; display: block; margin-top: 3px; }
        
        .btn-delete-absolute {
          position: absolute; top: 8px; right: 8px; z-index: 10;
          background: rgba(255, 0, 0, 0.7); color: white; border: none;
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }
        .faction-label { font-size: 0.65rem; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }

        /* Styles TACTICS Recap */
        .tactic-row { background: #111; border: 1px solid #222; border-radius: 8px; padding: 10px; margin-bottom: 6px; }
        .tactic-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: 900; }
        .badge-success { background: #198754; color: white; }
        .badge-fail { background: #dc3545; color: white; }
      `}</style>

      {/* HEADER PAGE */}
      <div className="d-flex justify-content-between align-items-center mb-4 pt-2">
        <button onClick={() => navigate("/")} className="btn btn-outline-secondary btn-sm px-3 text-white border-secondary"><span className="me-2">←</span>Retour</button>
        <h2 className="fw-bold text-white mb-0 text-uppercase tracking-tighter">Historique</h2>
      </div>

      {/* LISTE DES GAMES */}
      <div className="row g-3">
        {savedGames.map((game, index) => {
          const youBanner = bannerMapping[game.you?.slug?.toLowerCase()] || game.you?.slug || "default";
          const oppBanner = bannerMapping[game.opp?.slug?.toLowerCase()] || game.opp?.slug || "default";
          const scoreYou = getTotal(game.history, 'you');
          const scoreOpp = getTotal(game.history, 'opp');

          return (
            <div key={index} className="col-12 col-md-6">
              <div className="history-card shadow-lg" onClick={() => setSelectedGame(game)}>
                <div className="history-banner-box">
                  <div className="banner-half" style={{ backgroundImage: `url(/img/banner_${youBanner}.webp)` }}></div>
                  <div className="banner-half" style={{ backgroundImage: `url(/img/banner_${oppBanner}.webp)` }}></div>
                  <button className="btn-delete-absolute" onClick={(e) => deleteGame(e, game.date)}>×</button>
                </div>
                
                <div className="p-3 d-flex justify-content-between align-items-center">
                  <div className="overflow-hidden pe-2">
                    <div className="text-warning fw-bold text-uppercase text-truncate" style={{maxWidth: '180px'}}>{game.battleplan?.name}</div>
                    <div className="d-flex align-items-center gap-1 my-1">
                        <span className="faction-label text-info text-truncate" style={{maxWidth: '80px'}}>{game.you?.name}</span>
                        <span className="text-white-50 small">vs</span>
                        <span className="faction-label text-danger text-truncate" style={{maxWidth: '80px'}}>{game.opp?.name}</span>
                    </div>
                    <div className="text-white-50 tiny" style={{fontSize: '0.6rem'}}>{formatDate(game.date)}</div>
                  </div>
                  <div className="text-end bg-black bg-opacity-25 px-3 py-1 rounded-3 border border-secondary border-opacity-10 flex-shrink-0">
                    <span className={`h5 mb-0 fw-black ${scoreYou >= scoreOpp ? 'text-info' : 'text-white-50'}`}>{scoreYou}</span>
                    <span className="mx-2 text-secondary small opacity-50">VS</span>
                    <span className={`h5 mb-0 fw-black ${scoreOpp > scoreYou ? 'text-danger' : 'text-white-50'}`}>{scoreOpp}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE RÉCAPITULATIVE COMPLÈTE */}
      {selectedGame && (
        <div className="modal-recap-overlay animate__animated animate__fadeInUp animate__faster">
          <div className="container max-width-600 px-2 pb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <div className="text-warning fw-bold text-uppercase small">Rapport de Bataille</div>
                <div className="text-white-50 small">{formatDate(selectedGame.date)}</div>
              </div>
              <button className="btn btn-outline-danger btn-sm rounded-pill px-4" onClick={() => setSelectedGame(null)}>FERMER</button>
            </div>

            {/* WINNER CARDS SECTION */}
            <div className="row g-2 mb-4">
              {["You", "Opponent"].map(p => {
                const isY = p === "You";
                const factionSlug = isY ? selectedGame.you?.slug : selectedGame.opp?.slug;
                const banner = bannerMapping[factionSlug?.toLowerCase()] || factionSlug;
                const score = getTotal(selectedGame.history, isY ? 'you' : 'opp');
                const otherScore = getTotal(selectedGame.history, isY ? 'opp' : 'you');
                const isWinner = score >= otherScore;

                return (
                  <div key={p} className="col-6">
                    <div className="winner-card-mini" style={{ backgroundImage: `url(/img/banner_${banner}.webp)`, border: isWinner ? '2px solid #ffc107' : '1px solid black' }}>
                      <div className="card-overlay"></div>
                      <div className="card-content text-center">
                        <div className="h1 fw-black m-0 text-white">{score}</div>
                        <div className={`fw-bold text-uppercase ${isY ? "text-info" : "text-danger"}`} style={{fontSize: '0.65rem', letterSpacing: '1px'}}>
                          {isY ? selectedGame.you?.name : selectedGame.opp?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BATTLEPLAN INFO */}
            <div className="p-3 bg-dark bg-opacity-50 rounded-4 border border-secondary border-opacity-20 text-center mb-4">
                <div className="text-secondary tiny text-uppercase mb-1" style={{fontSize: '0.6rem'}}>Battleplan</div>
                <div className="fw-bold text-warning text-uppercase" style={{letterSpacing: '1px'}}>{selectedGame.battleplan?.name}</div>
            </div>

            {/* TABLEAU DES SCORES PAR ROUND */}
            <h6 className="text-white-50 text-uppercase fw-bold mb-3" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>Score détaillé</h6>
            <div className="table-responsive mb-4">
              <table className="table-score">
                <thead>
                  <tr className="text-secondary small text-uppercase"><th className="ps-3">RD</th><th>MOI</th><th className="text-end pe-2">ADV</th></tr>
                </thead>
                <tbody>
                  {selectedGame.history.map((r, i) => (
                    <tr key={i}>
                      <td className="td-round">R{r.round}</td>
                      <td>
                        <span className="score-pill">{r.youTotal} PTS</span>
                      </td>
                      <td className="text-end pe-2">
                        <span className="score-pill">{r.oppTotal} PTS</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION RECAP DES BATTLE TACTICS (NEW) */}
            <h6 className="text-white-50 text-uppercase fw-bold mb-3" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>Objectifs Tactiques</h6>
            <div className="row g-2 mb-4">
              {/* Colonne MOI */}
              <div className="col-6">
                <div className="text-info tiny text-uppercase fw-bold mb-2 ps-1">Moi</div>
                {selectedGame.history.map((r, i) => {
                  const hasSuccess = r.tacticYou && r.tacticYou.length > 0;
                  return (
                    <div key={i} className="tactic-row d-flex align-items-center justify-content-between">
                      <span className="text-white-50 fw-bold small">R{r.round}</span>
                      <span className={`tactic-badge ${hasSuccess ? 'badge-success' : 'badge-fail'}`}>
                        {hasSuccess ? 'Succès' : 'Échec'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Colonne ADVERSAIRE */}
              <div className="col-6">
                <div className="text-danger tiny text-uppercase fw-bold mb-2 ps-1">Adversaire</div>
                {selectedGame.history.map((r, i) => {
                  const hasSuccess = r.tacticOpp && r.tacticOpp.length > 0;
                  return (
                    <div key={i} className="tactic-row d-flex align-items-center justify-content-between">
                      <span className="text-white-50 fw-bold small">R{r.round}</span>
                      <span className={`tactic-badge ${hasSuccess ? 'badge-success' : 'badge-fail'}`}>
                        {hasSuccess ? 'Succès' : 'Échec'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button className="btn btn-warning w-100 py-3 fw-black text-dark text-uppercase mb-4" style={{letterSpacing: '1px'}} onClick={() => setSelectedGame(null)}>
              Retour à l'historique
            </button>
          </div>
        </div>
      )}
    </div>
  );
}