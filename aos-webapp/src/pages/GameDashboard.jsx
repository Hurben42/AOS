import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { battleplansData } from "../data/battleplansData"; 
import battleTacticsData from "../data/battletactics.json";

// --- RÉFÉRENTIEL DES RÈGLES SPÉCIFIQUES ---
const PLAN_RULES_EXTRAS = {
  "Noxious Nexus": {
    noScoringRound: 1, 
    rules: [
      { id: "heartwood_final", startRound: 5 }
    ]
  },
  "Tangled Roots": {
    rules: [
      { id: "more", startRound: 2 } 
    ]
  }
};

export default function GameDashboard() {
  const navigate = useNavigate();

  // --- PERSISTANCE DES ÉTATS ---
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem("active_game_session");
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [currentTurn, setCurrentTurn] = useState(() => {
    return Number(localStorage.getItem("game_current_turn")) || 1;
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("game_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [historyRoundScores, setHistoryRoundScores] = useState(() => {
    try {
      const saved = localStorage.getItem("game_history_scores");
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [roundScores, setRoundScores] = useState(() => {
    try {
      const saved = localStorage.getItem("game_round_scores");
      return saved ? JSON.parse(saved) : { You: {}, Opponent: {} };
    } catch (e) { return { You: {}, Opponent: {} }; }
  });

  const [firstPlayer, setFirstPlayer] = useState("You"); 
  const [priorityWinner, setPriorityWinner] = useState("You");
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    localStorage.setItem("game_current_turn", currentTurn);
    localStorage.setItem("game_history", JSON.stringify(history));
    localStorage.setItem("game_round_scores", JSON.stringify(roundScores));
    localStorage.setItem("game_history_scores", JSON.stringify(historyRoundScores));
  }, [currentTurn, history, roundScores, historyRoundScores, session, navigate]);

  if (!session || !session.you) return <div className="bg-black vh-100" />;

  // --- LOGIQUE DE SCORE ET FILTRAGE ---
  const getPlanLogic = () => {
    const name = session?.battleplan?.name;
    if (!name) return null;
    for (const s in battleplansData) {
      if (battleplansData[s][name]) return battleplansData[s][name];
    }
    return null;
  };

  const planLogic = getPlanLogic();
  const planName = session?.battleplan?.name;

  const isOptionAvailable = (optId, turn) => {
    const planExtra = PLAN_RULES_EXTRAS[planName];
    if (planExtra?.noScoringRound === turn) return false;
    const rule = planExtra?.rules?.find(r => r.id === optId);
    if (rule && rule.startRound && turn < rule.startRound) return false;
    return true;
  };

  const getScenarioOptions = (turn) => {
    if (!planLogic) return [];
    let options = [];
    if (typeof planLogic.customOptions === 'function') {
      options = planLogic.customOptions(turn);
    } else {
      options = planLogic.customOptions || [];
    }
    if (turn === 5 && planLogic.endOfGameBonus) {
      options = [...options, planLogic.endOfGameBonus];
    }
    return options.filter(opt => isOptionAvailable(opt.id, turn));
  };

  const scenarioOptions = getScenarioOptions(currentTurn);

  const calculateTurnScore = (player, scoresForTurn, turnNum) => {
    if (!scoresForTurn) return 0;
    let pts = 0;
    const options = getScenarioOptions(turnNum);
    options.forEach(opt => { 
      if (scoresForTurn[opt.id]) pts += (opt.vp || 0); 
    });
    if (scoresForTurn.card0) pts += 4;
    if (scoresForTurn.card1) pts += 4;
    return pts;
  };

  const currentTotalYou = history.filter(h => h.round < currentTurn).reduce((acc, r) => acc + r.youTotal, 0) + calculateTurnScore("You", roundScores.You, currentTurn);
  const currentTotalOpp = history.filter(h => h.round < currentTurn).reduce((acc, r) => acc + r.oppTotal, 0) + calculateTurnScore("Opponent", roundScores.Opponent, currentTurn);

  const underdog = currentTurn > 1 
    ? (currentTotalYou < currentTotalOpp ? "You" : (currentTotalOpp < currentTotalYou ? "Opponent" : null))
    : null;

  const getTacticLabels = (groupSlug, player, targetTurn = currentTurn, currentHistory = history) => {
    if (!groupSlug) return { step: "-", group: "Non sélectionné", currentCount: 0, completed: false, allSteps: [] };
    const group = battleTacticsData.find(t => t.id === groupSlug || t.slug === groupSlug);
    if (!group) return { step: "-", group: "Inconnu", currentCount: 0, completed: false, allSteps: [] };

    const count = currentHistory.filter(h => {
        if (h.round >= targetTurn) return false;
        return player === "You" 
          ? (h.card0Success || h.card1Success)
          : (h.oppCard0Success || h.oppCard1Success);
    }).length;
    
    const steps = [group.affray, group.strike, group.domination];
    const currentStepName = steps[count] || steps[2] || "Complétée";
    return { 
      step: currentStepName, 
      group: group.name, 
      currentCount: count + 1, 
      completed: count >= 3,
      allSteps: steps
    };
  };

  const handleNextRound = () => {
    const cleanHistory = history.filter(h => h.round < currentTurn);
    
    const youT0 = getTacticLabels(session.you?.tactics?.[0], "You", currentTurn, cleanHistory);
    const youT1 = getTacticLabels(session.you?.tactics?.[1], "You", currentTurn, cleanHistory);
    const oppT0 = getTacticLabels(session.opp?.tactics?.[0], "Opponent", currentTurn, cleanHistory);
    const oppT1 = getTacticLabels(session.opp?.tactics?.[1], "Opponent", currentTurn, cleanHistory);

    const tacticsYouList = [];
    if (roundScores.You?.card0) tacticsYouList.push(youT0.step);
    if (roundScores.You?.card1) tacticsYouList.push(youT1.step);

    const tacticsOppList = [];
    if (roundScores.Opponent?.card0) tacticsOppList.push(oppT0.step);
    if (roundScores.Opponent?.card1) tacticsOppList.push(oppT1.step);

    const entry = {
      round: currentTurn,
      youTotal: calculateTurnScore("You", roundScores.You, currentTurn),
      oppTotal: calculateTurnScore("Opponent", roundScores.Opponent, currentTurn),
      tacticYou: tacticsYouList,
      tacticOpp: tacticsOppList,
      card0Success: !!roundScores.You?.card0,
      card1Success: !!roundScores.You?.card1,
      oppCard0Success: !!roundScores.Opponent?.card0,
      oppCard1Success: !!roundScores.Opponent?.card1
    };
    
    const newHistory = [...cleanHistory, entry];
    setHistoryRoundScores(prev => ({ ...prev, [currentTurn]: roundScores }));
    setHistory(newHistory);

    if (currentTurn < 5) {
      setCurrentTurn(currentTurn + 1);
      setRoundScores(historyRoundScores[currentTurn + 1] || { You: {}, Opponent: {} });
    } else {
      setIsGameOver(true);
    }
  };

  const handleBack = () => {
    const targetTurn = isGameOver ? 5 : currentTurn - 1;
    if (targetTurn >= 1) {
      setCurrentTurn(targetTurn);
      setIsGameOver(false);
      if (historyRoundScores[targetTurn]) setRoundScores(historyRoundScores[targetTurn]);
    }
  };

  const confirmQuit = () => {
    if (window.confirm("Quitter la partie ?")) {
      ["active_game_session", "game_current_turn", "game_history", "game_round_scores", "game_history_scores"].forEach(k => localStorage.removeItem(k));
      navigate("/");
    }
  };

  if (isGameOver) {
    const winner = currentTotalYou > currentTotalOpp ? "You" : currentTotalOpp > currentTotalYou ? "Opponent" : "Draw";
    let cumulativeYou = 0;
    let cumulativeOpp = 0;

    return (
      <div className="min-vh-100 bg-black text-white font-monospace p-3">
        <style>{`
          .winner-card { 
            position: relative;
            height: 140px;
            background-size: cover;
            background-position: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border: 1px solid #333;
            overflow: hidden;
          }
          .winner-card-active { border: 2px solid #ffc107 !important; box-shadow: 0 0 20px rgba(255,193,7,0.3); }
          .card-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%);
            z-index: 1;
          }
          .card-content { position: relative; z-index: 2; }
          .table-score { width: 100%; border-collapse: separate; border-spacing: 0 4px; font-size: 0.8rem; }
          .table-score th { color: #666; text-transform: uppercase; font-size: 0.65rem; padding: 8px; border-bottom: 1px solid #222; }
          .table-score td { background: #111; padding: 10px 8px; vertical-align: middle; }
          .td-round { border-left: 2px solid #ffc107; font-weight: bold; color: #ffc107; width: 40px; text-align: center; }
          .score-pill { background: #222; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
          .cumul-text { font-size: 0.7rem; color: #555; display: block; }
          .tactic-success-text { font-size: 0.72rem; font-style: italic; font-weight: bold; margin-top: 2px; display: block; line-height: 1.1; }
          .bt-list { list-style: none; padding: 0; margin: 0; font-size: 0.7rem; }
          .bt-item { padding: 4px 0; border-bottom: 1px solid #222; }
        `}</style>

        <h3 className="text-center text-warning fw-bold mb-4">RÉSULTAT FINAL</h3>

        <div className="row g-2 mb-4">
          {["You", "Opponent"].map(p => {
            const isY = p === "You";
            const factionSlug = isY ? session.you?.slug : session.opp?.slug;
            const score = isY ? currentTotalYou : currentTotalOpp;
            const isWinner = winner === p;

            return (
              <div key={p} className="col-6">
                <div 
                  className={`winner-card ${isWinner ? 'winner-card-active' : 'opacity-50'}`}
                  style={{ backgroundImage: `url(/img/banner_${factionSlug}.webp)` }}
                >
                  <div className="card-overlay"></div>
                  <div className="card-content text-center">
                    <div className="h2 fw-bold m-0 text-white">{score}</div>
                    <div className={`fw-bold small ${isY ? "text-info" : "text-danger"}`}>
                      {isY ? "MOI" : "ADV"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="table-responsive mb-4">
          <table className="table-score">
            <thead>
              <tr><th>RD</th><th>MOI</th><th>ADV</th></tr>
            </thead>
            <tbody>
              {history.map((r, i) => {
                cumulativeYou += r.youTotal;
                cumulativeOpp += r.oppTotal;
                return (
                  <tr key={i}>
                    <td className="td-round">R{r.round}</td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="score-pill">{r.youTotal} PTS</span>
                        {r.round > 1 && <span className="cumul-text">Total: {cumulativeYou}</span>}
                        {r.tacticYou.map((t, idx) => (
                          <span key={idx} className="tactic-success-text text-success">✓ {t}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="score-pill">{r.oppTotal} PTS</span>
                        {r.round > 1 && <span className="cumul-text">Total: {cumulativeOpp}</span>}
                        {r.tacticOpp.map((t, idx) => (
                          <span key={idx} className="tactic-success-text text-success">✓ {t}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h5 className="text-warning fw-bold small mb-2 text-uppercase">Battle Tactics</h5>
        <div className="table-responsive mb-4">
          <table className="table-score">
            <thead>
              <tr><th>MOI</th><th>ADV</th></tr>
            </thead>
            <tbody>
              <tr>
                {[ "You", "Opponent" ].map(p => {
                  const pInfo = p === "You" ? session.you : session.opp;
                  const totalValidCount = history.filter(h => p === "You" ? (h.card0Success || h.card1Success) : (h.oppCard0Success || h.oppCard1Success)).length;
                  
                  return (
                    <td key={p} style={{ verticalAlign: 'top' }}>
                      {pInfo.tactics.map((slug, gIdx) => {
                        const data = getTacticLabels(slug, p, 6, history);
                        return (
                          <div key={gIdx} className="mb-3">
                            <div className="text-warning tiny fw-bold border-bottom border-secondary mb-1" style={{fontSize:'0.6rem'}}>{data.group}</div>
                            <ul className="bt-list">
                              {data.allSteps.map((stepName, sIdx) => {
                                const isDone = totalValidCount > sIdx;
                                return (
                                  <li key={sIdx} className="bt-item d-flex align-items-center">
                                    <span className={isDone ? "text-success me-1" : "text-danger me-1"}>{isDone ? "✓" : "✘"}</span>
                                    <span className={isDone ? "text-white" : "opacity-50"}>{stepName}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="d-grid gap-2">
          <button className="btn btn-secondary py-3 fw-bold rounded-0" onClick={handleBack}>RETOUR</button>
          <button className="btn btn-warning py-3 fw-bold rounded-0 text-dark" onClick={() => {
              const finalData = { ...session, history, date: new Date().toISOString() };
              const savedGames = JSON.parse(localStorage.getItem("saved_games") || "[]");
              localStorage.setItem("saved_games", JSON.stringify([finalData, ...savedGames]));
              ["active_game_session", "game_current_turn", "game_history", "game_round_scores", "game_history_scores"].forEach(k => localStorage.removeItem(k));
              navigate("/");
          }}>ENREGISTRER LA BATAILLE</button>
        </div>
      </div>
    );
  }

  // --- RENDER CLASSIQUE (PENDANT LA PARTIE) ---
  const displayOrder = firstPlayer === "You" ? ["You", "Opponent"] : ["Opponent", "You"];

  return (
    <div className="min-vh-100 bg-black text-white font-monospace pb-5">
      <style>{`
        .game-header { position: relative; height: 180px; display: flex; border-bottom: 2px solid #000; overflow: hidden; }
        .faction-banner { width: 50%; height: 100%; background-size: cover; background-position: center; }
        .rd-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 3px solid #ffc107; background: #000; width: 60px; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; }
        .score-box { position: absolute; inset: 0; display: flex; justify-content: space-between; align-items: flex-end; padding: 20px; z-index: 11; pointer-events: none; }
        .tactic-btn { height: 55px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px !important; border-radius: 0 !important; margin-bottom: 8px; border: 1px solid #333 !important; }
        .tactic-step-count { font-size: 0.6rem; color: #ffc107; background: rgba(0,0,0,0.4); padding: 1px 5px; border: 1px solid rgba(255,193,7,0.3); margin-left: 8px; }
        .underdog-badge { font-size: 0.6rem; color: #ffc107; background: rgba(0,0,0,0.4); padding: 1px 5px; border: 1px solid rgba(255,193,7,0.3); vertical-align: middle; margin: 0 5px; text-transform: uppercase; }
        .btn-quit-header { position: absolute; top: 10px; right: 10px; z-index: 20; background: rgba(0,0,0,0.5); border: 1px solid #444; color: #666; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
      `}</style>

      <div className="game-header">
        {currentTurn > 1 && <button className="btn-quit-header" onClick={confirmQuit}>×</button>}
        <div className="faction-banner" style={{ backgroundImage: `url(/img/banner_${session.you?.slug}.webp)`, borderLeft: '3px solid #0dcaf0' }}></div>
        <div className="faction-banner" style={{ backgroundImage: `url(/img/banner_${session.opp?.slug}.webp)`, borderRight: '3px solid #dc3545' }}></div>
        <div className="rd-badge text-warning shadow"><small className="fw-bold">RD</small><div className="h3 fw-bold m-0">{currentTurn}</div></div>
        <div className="score-box">
          <div className="text-center">
            <div className="display-4 fw-bold m-0 text-white">{currentTotalYou}</div>
            <div className="text-info fw-bold small">{session.you?.name} {underdog === "You" && <span className="underdog-badge">UD</span>}</div>
          </div>
          <div className="text-center">
            <div className="display-4 fw-bold m-0 text-white">{currentTotalOpp}</div>
            <div className="text-danger fw-bold small">{underdog === "Opponent" && <span className="underdog-badge">UD</span>} {session.opp?.name}</div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="row g-1 mb-4">
          <div className="col-6"><button className={`btn btn-sm w-100 rounded-0 ${priorityWinner === "You" ? "btn-info text-dark fw-bold" : "btn-dark"}`} onClick={() => setPriorityWinner("You")}>PRIO: MOI</button></div>
          <div className="col-6"><button className={`btn btn-sm w-100 rounded-0 ${priorityWinner === "Opponent" ? "btn-danger fw-bold" : "btn-dark"}`} onClick={() => setPriorityWinner("Opponent")}>PRIO: ADV</button></div>
          <div className="col-6 mt-1"><button className={`btn btn-sm w-100 rounded-0 ${firstPlayer === "You" ? "btn-info text-dark fw-bold" : "btn-dark"}`} onClick={() => setFirstPlayer("You")}>1ST: MOI</button></div>
          <div className="col-6 mt-1"><button className={`btn btn-sm w-100 rounded-0 ${firstPlayer === "Opponent" ? "btn-danger fw-bold" : "btn-dark"}`} onClick={() => setFirstPlayer("Opponent")}>1ST: ADV</button></div>
        </div>

        {displayOrder.map(p => {
          const isYou = (p === "You");
          const pInfo = isYou ? session.you : session.opp;

          return (
            <div key={p} className="mb-4">
              <div className={`d-flex justify-content-between border-bottom pb-1 mb-3 ${isYou ? 'border-info' : 'border-danger'}`}>
                <span className="fw-bold">{pInfo?.name?.toUpperCase()}</span>
                <span className="text-warning fw-bold">{calculateTurnScore(p, roundScores[p], currentTurn)} PTS</span>
              </div>

              {scenarioOptions.map(opt => (
                <button key={opt.id} className={`btn btn-sm w-100 tactic-btn ${roundScores[p]?.[opt.id] ? (isYou ? 'btn-info text-dark fw-bold' : 'btn-danger fw-bold') : 'btn-dark text-white'}`}
                  onClick={() => setRoundScores(prev => ({...prev, [p]: {...prev[p], [opt.id]: !prev[p][opt.id]}}))}>
                  <span className="fw-bold">{opt.label}</span>
                  <span className="badge bg-black text-white border border-secondary">+{opt.vp}</span>
                </button>
              ))}

              <div className="mt-2 row g-1">
                {[0, 1].map(idx => {
                  const tData = getTacticLabels(pInfo?.tactics?.[idx], p);
                  const active = roundScores[p]?.[`card${idx}`];
                  return (
                    <div className="col-6" key={idx}>
                      <button disabled={tData.completed} 
                        className={`btn btn-sm w-100 text-start p-2 rounded-0 ${tData.completed ? 'btn-dark opacity-25' : active ? 'btn-success text-white' : 'btn-dark border-secondary text-white'}`}
                        style={{ height: '70px' }}
                        onClick={() => setRoundScores(prev => ({...prev, [p]: {...prev[p], [`card${idx}`]: !prev[p][`card${idx}`]}}))}>
                        <div className="text-start">
                          <div className="mb-1 d-flex align-items-center">
                              <small className="opacity-50" style={{fontSize: '0.65rem'}}>{tData.group}</small>
                              <span className="tactic-step-count">{tData.currentCount}/3</span>
                          </div>
                          <div className="text-uppercase fw-bold" style={{fontSize: '0.85rem'}}>{tData.step}</div>
                        </div>
                        {tData.completed ? <span className="text-success ms-auto">✔</span> : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed-bottom p-3 bg-black border-top border-secondary d-flex gap-2">
        {currentTurn === 1 && <button className="btn btn-outline-light rounded-0 px-2" onClick={confirmQuit}>QUITTER</button>}
        {currentTurn > 1 && <button className="btn btn-secondary rounded-0 px-3 fw-bold" onClick={handleBack}>RETOUR</button>}
        <button className="btn btn-warning flex-grow-1 py-3 fw-bold rounded-0" onClick={handleNextRound}>
          {currentTurn < 5 ? `FIN ROUND ${currentTurn}` : "VOIR LE RÉSULTAT"}
        </button>
      </div>
    </div>
  );
}