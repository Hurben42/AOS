import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { battleplansData } from "../data/battleplansData";

export default function GameDashboard() {
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [session, setSession] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [firstPlayer, setFirstPlayer] = useState("You");
  const [isGameOver, setIsGameOver] = useState(false);
  const [historyModal, setHistoryModal] = useState({ show: false, player: null, cardIndex: null });
  const [quitModal, setQuitModal] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [persistedUnderdog, setPersistedUnderdog] = useState(null);

  const [roundScores, setRoundScores] = useState({
    You: { obj1: false, obj2: false, objMore: false, objSpecial: false, card0: false, card1: false },
    Opponent: { obj1: false, obj2: false, objMore: false, objSpecial: false, card0: false, card1: false }
  });

  const [tacticProgress, setTacticProgress] = useState({
    You: [0, 0], Opponent: [0, 0]
  });

  // --- INITIALISATION ---
  useEffect(() => {
    const activeSession = JSON.parse(localStorage.getItem("active_game_session"));
    if (!activeSession) { navigate("/"); return; }
    setSession(activeSession);
  }, [navigate]);

  if (!session) return <div style={{background:'#000', height:'100vh'}} />;

  const plan = battleplansData["Passing Seasons"]?.[session.battleplan?.name] || { customOptions: [], tacticValue: 4 };
  const tacticNames = ["Affray", "Strike", "Domination"];
  const tacticVP = plan.tacticValue || 4;

  // --- LOGIQUE RÉACTIVE (UNDERDOG / SEIZE) ---
  const lastRoundEntry = history[history.length - 1];
  const lastPlayerOfPrevRound = lastRoundEntry ? (lastRoundEntry.youFirst ? "Opponent" : "You") : null;
  const isDoubleTurn = (p) => currentTurn > 1 && firstPlayer === p && lastPlayerOfPrevRound === p;
  const totalPoints = (p) => history.reduce((acc, r) => acc + (p === "You" ? r.youTotal : r.oppTotal), 0);

  // Détermination Underdog en temps réel
  const getUnderdog = () => {
    if (isDoubleTurn("You") && (totalPoints("Opponent") - totalPoints("You") < 11)) return "Opponent";
    if (isDoubleTurn("Opponent") && (totalPoints("You") - totalPoints("Opponent") < 11)) return "You";
    return persistedUnderdog;
  };

  const activeUnderdog = getUnderdog();

  const canScoreTactics = (p) => {
    if (!isDoubleTurn(p)) return true;
    const diff = p === "You" ? totalPoints("Opponent") - totalPoints("You") : totalPoints("You") - totalPoints("Opponent");
    return diff >= 11;
  };

  const calculateScore = (player, data) => {
    const s = data[player];
    let scVP = 0;
    if (plan.customOptions) {
      if (plan.customOptions[0] && s.obj1) scVP += plan.customOptions[0].vp;
      if (plan.customOptions[1] && s.obj2) scVP += plan.customOptions[1].vp;
      if (plan.customOptions[2] && s.objMore) scVP += plan.customOptions[2].vp;
      if (plan.customOptions[3] && s.objSpecial) scVP += plan.customOptions[3].vp;
    }
    const tAllowed = canScoreTactics(player);
    const tacVP = tAllowed ? ((s.card0 ? tacticVP : 0) + (s.card1 ? tacticVP : 0)) : 0;
    return { scenario: scVP, tactics: tacVP, total: scVP + tacVP };
  };

  // --- ACTIONS ---
  const toggleTactic = (p, idx) => {
      const key = `card${idx}`;
      setRoundScores(prev => ({...prev, [p]: {...prev[p], [key]: !prev[p][key] }}));
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const lastEntry = newHistory.pop();
    setHistory(newHistory);
    setCurrentTurn(lastEntry.round);
    setFirstPlayer(lastEntry.youFirst ? "You" : "Opponent");
    setTacticProgress(lastEntry.savedProgress);
    setRoundScores(lastEntry.savedRoundScores);
    setPersistedUnderdog(lastEntry.savedUnderdog);
  };

  const handleNextRound = () => {
    const youS = calculateScore("You", roundScores);
    const oppS = calculateScore("Opponent", roundScores);

    setHistory([...history, {
      round: currentTurn,
      youTotal: youS.total, youScenario: youS.scenario, youTactics: youS.tactics,
      oppTotal: oppS.total, oppScenario: oppS.scenario, oppTactics: oppS.tactics,
      youFirst: firstPlayer === "You",
      savedRoundScores: JSON.parse(JSON.stringify(roundScores)),
      savedProgress: JSON.parse(JSON.stringify(tacticProgress)),
      savedUnderdog: activeUnderdog
    }]);

    setPersistedUnderdog(activeUnderdog);

    const nextProg = {
      You: [roundScores.You.card0 ? tacticProgress.You[0] + 1 : tacticProgress.You[0], roundScores.You.card1 ? tacticProgress.You[1] + 1 : tacticProgress.You[1]],
      Opponent: [roundScores.Opponent.card0 ? tacticProgress.Opponent[0] + 1 : tacticProgress.Opponent[0], roundScores.Opponent.card1 ? tacticProgress.Opponent[1] + 1 : tacticProgress.Opponent[1]]
    };
    setTacticProgress(nextProg);

    if (currentTurn < 5) {
      setCurrentTurn(currentTurn + 1);
      setRoundScores({
        You: { obj1: false, obj2: false, objMore: false, objSpecial: false, card0: false, card1: false },
        Opponent: { obj1: false, obj2: false, objMore: false, objSpecial: false, card0: false, card1: false }
      });
    } else {
      setIsGameOver(true);
    }
  };

  if (isGameOver) return <div className="min-vh-100 bg-black text-white p-4 text-center"><h2>BATTLE FINISHED</h2><button className="btn btn-warning mt-4" onClick={() => navigate("/")}>HOME</button></div>;

  const players = firstPlayer === "You" ? ["You", "Opponent"] : ["Opponent", "You"];

  return (
    <div className="min-vh-100 bg-black text-white p-2 font-monospace">
      
      {/* TOP BAR / QUIT */}
      <div className="d-flex justify-content-end mb-2">
          <button className="btn btn-sm btn-outline-danger border-opacity-25" onClick={() => setQuitModal(true)}>QUITTER</button>
      </div>

      {/* HEADER SCORE */}
      <div className="d-flex justify-content-between p-3 mb-3 bg-dark border border-secondary rounded">
        <div className="text-center"><small className="text-info d-block">YOU</small><span className="h4 fw-bold">{totalPoints("You") + calculateScore("You", roundScores).total}</span></div>
        <div className="align-self-center text-warning fw-bold">RD {currentTurn}/5</div>
        <div className="text-center"><small className="text-danger d-block">OPP</small><span className="h4 fw-bold">{totalPoints("Opponent") + calculateScore("Opponent", roundScores).total}</span></div>
      </div>

      {/* PRIORITY SELECTION */}
      <div className="btn-group w-100 mb-3 border border-secondary rounded-pill overflow-hidden">
        <button className={`btn btn-sm py-2 ${firstPlayer === "You" ? "btn-light text-dark fw-bold" : "btn-dark text-white-50"}`} onClick={() => setFirstPlayer("You")}>YOU START</button>
        <button className={`btn btn-sm py-2 ${firstPlayer === "Opponent" ? "btn-light text-dark fw-bold" : "btn-dark text-white-50"}`} onClick={() => setFirstPlayer("Opponent")}>OPP START</button>
      </div>

      {players.map(p => {
        const isYou = p === "You";
        const isUnd = activeUnderdog === p;
        const dt = isDoubleTurn(p);
        const tAllowed = canScoreTactics(p);
        const score = calculateScore(p, roundScores);

        return (
          <div key={p} className={`mb-3 border rounded-3 overflow-hidden ${isUnd ? 'border-warning shadow' : 'border-secondary'}`} style={{background: '#0a0a0a'}}>
            <div className="d-flex justify-content-between p-2 bg-dark border-bottom border-secondary align-items-center">
              <div className="d-flex gap-2 align-items-center">
                <span className={`fw-bold ${isYou ? 'text-info' : 'text-danger'}`}>{isYou ? "YOU" : "OPPONENT"}</span>
                {dt && <span className="badge border border-danger text-danger" style={{fontSize:'0.6rem'}}>SEIZING INITIATIVE</span>}
                {isUnd && <span className="badge bg-warning text-dark" style={{fontSize:'0.6rem'}}>UNDERDOG</span>}
              </div>
              <span className="text-warning fw-bold">{score.total} VP</span>
            </div>

            <div className="p-2">
              {plan.customOptions?.map((opt, i) => (
                <button key={i} className={`btn btn-sm w-100 mb-2 text-start d-flex justify-content-between ${roundScores[p][['obj1','obj2','objMore','objSpecial'][i]] ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary text-white border-opacity-25'}`}
                  onClick={() => setRoundScores(prev => ({...prev, [p]: {...prev[p], [['obj1','obj2','objMore','objSpecial'][i]]: !prev[p][[['obj1','obj2','objMore','objSpecial'][i]]] }}))}>
                  <span style={{fontSize: '0.75rem'}}>{opt.label}</span><span>+{opt.vp}</span>
                </button>
              ))}

              <div className="row g-2 mt-1">
                {[0, 1].map(idx => {
                  const prog = tacticProgress[p][idx];
                  const isActive = roundScores[p][`card${idx}`];
                  return (
                    <div className="col-6 d-flex gap-1" key={idx}>
                      <button className={`btn btn-sm flex-grow-1 py-3 ${isActive ? 'btn-success text-dark fw-bold' : 'btn-outline-warning text-warning border-opacity-25'} ${(!tAllowed || prog > 2) ? 'opacity-25' : ''}`}
                        disabled={!tAllowed || prog > 2}
                        onClick={() => toggleTactic(p, idx)}>
                        <div style={{fontSize: '0.65rem'}}>{prog > 2 ? 'DONE' : tacticNames[prog]}</div>
                      </button>
                      <button className="btn btn-dark border-secondary border-opacity-25 px-2" 
                              onClick={() => setHistoryModal({ show: true, player: p, cardIndex: idx })}>
                        <small>👁</small>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* FOOTER NAV */}
      <div className="d-flex gap-2 mt-3 pb-5">
        {currentTurn > 1 && (
            <button className="btn btn-outline-secondary px-4 rounded-pill" onClick={handleBack}>RETOUR</button>
        )}
        <button className="btn btn-warning flex-grow-1 py-3 fw-bold rounded-pill text-dark shadow" onClick={handleNextRound}>
          {currentTurn < 5 ? `VALIDER ROUND ${currentTurn}` : "FINIR LA BATAILLE"}
        </button>
      </div>

      {/* MODAL QUITTER */}
      {quitModal && (
        <div className="modal d-block" style={{backgroundColor:'rgba(0,0,0,0.9)'}}>
          <div className="modal-dialog modal-dialog-centered p-3">
            <div className="modal-content bg-dark border border-danger">
              <div className="modal-body text-center p-4">
                <h4 className="text-white mb-4">Quitter ?</h4>
                <button className="btn btn-warning w-100 py-3 mb-2 fw-bold text-dark" onClick={() => navigate("/")}>SAUVEGARDER & QUITTER</button>
                <button className="btn btn-outline-danger w-100 mb-3" onClick={() => navigate("/")}>SUPPRIMER & QUITTER</button>
                <button className="btn btn-link text-white-50 text-decoration-none" onClick={() => setQuitModal(false)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIQUE TACTIQUE (L'OEIL) */}
      {historyModal.show && (
        <div className="modal d-block" style={{backgroundColor:'rgba(0,0,0,0.9)'}}>
          <div className="modal-dialog modal-dialog-centered p-3">
            <div className="modal-content bg-dark border border-secondary">
              <div className="modal-header border-secondary"><h6 className="mb-0">Tactiques validées</h6></div>
              <div className="modal-body">
                {history.filter(h => h[`${historyModal.player === 'You' ? 'you' : 'opp'}Tactics`] > 0).length === 0 ? (
                    <p className="text-muted small">Aucune tactique validée dans ce groupe.</p>
                ) : (
                    history.map((h, i) => (
                        <div key={i} className="d-flex justify-content-between border-bottom border-secondary border-opacity-25 py-2">
                            <span>Round {h.round}</span>
                            <span className="text-success">Validée</span>
                        </div>
                    ))
                )}
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-warning w-100" onClick={() => setHistoryModal({show:false})}>FERMER</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}