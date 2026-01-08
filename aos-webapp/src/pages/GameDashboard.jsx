import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { battleplansData } from "../data/battleplansData"; 
import { battleplansData as battleplansRules } from "../data/battleplansRules"; 
import battleTacticsData from "../data/battletactics.json";

const LAYOUT_IMAGES = {
  "Grasp of Thorns": "grasp-of-thorns.png",
  "Creeping Corruption": "creeping-corruption.png",
  "Lifecycle": "lifecycle.png",
  "Bountiful Equinox": "bountiful-equinox.png",
  "The Liferoots": "the-liferoots.png",
  "Noxious Nexus": "noxious-nexus.png",
  "Linked Ley Lines": "linked-ley-lines.png",
  "Surge of Slaughter": "surge-of-slaughter.png",
  "Cyclic Shifts": "cyclic-shifts.png",
  "Roiling Roots": "roiling-roots.png",
  "Paths of the Fey": "paths-of-the-fey.png",
  "Passing Seasons": "passing-seasons.png"
};

const PLAN_RULES_EXTRAS = {
  "Noxious Nexus": {
    noScoringRound: 1, 
    rules: [{ id: "heartwood_final", startRound: 5 }]
  },
  "Tangled Roots": {
    rules: [{ id: "more", startRound: 2 }]
  }
};

export default function GameDashboard() {
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem("active_game_session");
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [currentTurn, setCurrentTurn] = useState(() => Number(localStorage.getItem("game_current_turn")) || 1);
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
  const [underdog, setUnderdog] = useState(() => localStorage.getItem("game_underdog") || null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");

  useEffect(() => {
    if (!session) { navigate("/"); return; }
    localStorage.setItem("game_current_turn", currentTurn);
    localStorage.setItem("game_history", JSON.stringify(history));
    localStorage.setItem("game_round_scores", JSON.stringify(roundScores));
    localStorage.setItem("game_history_scores", JSON.stringify(historyRoundScores));
    if (underdog) localStorage.setItem("game_underdog", underdog);
  }, [currentTurn, history, roundScores, historyRoundScores, session, navigate, underdog]);

  if (!session || !session.you) return <div className="bg-black vh-100" />;

  const lastRound = history.find(h => h.round === currentTurn - 1);
  const totalYouBefore = history.reduce((acc, r) => acc + r.youTotal, 0);
  const totalOppBefore = history.reduce((acc, r) => acc + r.oppTotal, 0);

  const checkSeize = () => {
    if (currentTurn === 1 || !lastRound) return false;
    const wasSecondLastRound = lastRound.firstPlayer === "You" ? "Opponent" : "You";
    const chosenToGoFirst = firstPlayer;
    const opponentLead = chosenToGoFirst === "You" ? (totalOppBefore - totalYouBefore) : (totalYouBefore - totalOppBefore);
    if (priorityWinner === wasSecondLastRound && chosenToGoFirst === wasSecondLastRound && opponentLead < 11) {
      return true;
    }
    return false;
  };

  const didSeizeInitiative = checkSeize();

  useEffect(() => {
    if (didSeizeInitiative) {
      setUnderdog(firstPlayer === "You" ? "Opponent" : "You");
    }
  }, [didSeizeInitiative, firstPlayer]);

  // Logique pour le score (battleplansData)
  const getPlanLogic = () => {
    const name = session?.battleplan?.name;
    for (const s in battleplansData) { if (battleplansData[s][name]) return battleplansData[s][name]; }
    return null;
  };

  // Logique pour les textes (battleplansRules)
  const getPlanRules = () => {
    const name = session?.battleplan?.name;
    for (const s in battleplansRules) { if (battleplansRules[s][name]) return battleplansRules[s][name]; }
    return null;
  };

  const planLogic = getPlanLogic();
  const planTexts = getPlanRules();
  const planName = session?.battleplan?.name;

  // --- NOUVELLE FONCTION POUR L'IMAGE ---
  const getPlanImagePath = () => {
    if (!planName) return "/battleplans/GeneralHandbook_files/default.png";
    // Transforme "Passing Seasons" en "Passing-Seasons1.png"
    const fileName = planName.trim().replace(/\s+/g, '-');
    return `/battleplans/GeneralHandbook_files/${fileName}1.png`;
  };

  const getScenarioOptions = (turn) => {
    if (!planLogic) return [];
    let options = typeof planLogic.customOptions === 'function' ? planLogic.customOptions(turn) : (planLogic.customOptions || []);
    if (turn === 5 && planLogic.endOfGameBonus) options = [...options, planLogic.endOfGameBonus];
    return options.filter(opt => {
        const planExtra = PLAN_RULES_EXTRAS[planName];
        if (planExtra?.noScoringRound === turn) return false;
        const rule = planExtra?.rules?.find(r => r.id === opt.id);
        if (rule && rule.startRound && turn < rule.startRound) return false;
        return true;
    });
  };

  const scenarioOptions = getScenarioOptions(currentTurn);

  const calculateTurnScore = (player, scoresForTurn, turnNum) => {
    if (!scoresForTurn) return 0;
    let pts = 0;
    getScenarioOptions(turnNum).forEach(opt => { if (scoresForTurn[opt.id]) pts += (opt.vp || 0); });
    const isSeizing = (player === firstPlayer && didSeizeInitiative);
    if (!isSeizing) {
      if (scoresForTurn.card0) pts += 4;
      if (scoresForTurn.card1) pts += 4;
    }
    return pts;
  };

  const currentTotalYou = totalYouBefore + calculateTurnScore("You", roundScores.You, currentTurn);
  const currentTotalOpp = totalOppBefore + calculateTurnScore("Opponent", roundScores.Opponent, currentTurn);

  const getTacticLabels = (groupSlug, player, currentHistory = history) => {
    if (!groupSlug) return { step: "-", group: "Non sélectionné", count: 0, completed: false, allSteps: [] };
    const group = battleTacticsData.find(t => t.id === groupSlug || t.slug === groupSlug);
    if (!group) return { step: "-", group: "Inconnu", count: 0, completed: false, allSteps: [] };
    const steps = [group.affray, group.strike, group.domination];
    const historyCount = currentHistory.filter(h => h.round < currentTurn).filter(h => {
        const tacticIndex = (player === "You" ? session.you : session.opp).tactics.indexOf(groupSlug);
        if (tacticIndex === 0) return player === "You" ? h.card0Success : h.oppCard0Success;
        if (tacticIndex === 1) return player === "You" ? h.card1Success : h.oppCard1Success;
        return false;
    }).length;
    const displayCount = Math.min(historyCount + 1, 3);
    return { step: historyCount >= 3 ? "Tactiques complétées" : steps[historyCount] || "Terminé", group: group.name, displayCount: `${displayCount}/3`, completed: historyCount >= 3, allSteps: steps, historyCount };
  };

  const handleNextRound = () => {
    const cleanHistory = history.filter(h => h.round < currentTurn);
    const youT0 = getTacticLabels(session.you?.tactics?.[0], "You", cleanHistory);
    const youT1 = getTacticLabels(session.you?.tactics?.[1], "You", cleanHistory);
    const oppT0 = getTacticLabels(session.opp?.tactics?.[0], "Opponent", cleanHistory);
    const oppT1 = getTacticLabels(session.opp?.tactics?.[1], "Opponent", cleanHistory);
    const entry = {
      round: currentTurn,
      firstPlayer,
      youTotal: calculateTurnScore("You", roundScores.You, currentTurn),
      oppTotal: calculateTurnScore("Opponent", roundScores.Opponent, currentTurn),
      tacticYou: [roundScores.You?.card0 && `${youT0.group} - ${youT0.displayCount}`, roundScores.You?.card1 && `${youT1.group} - ${youT1.displayCount}`].filter(Boolean),
      tacticOpp: [roundScores.Opponent?.card0 && `${oppT0.group} - ${oppT0.displayCount}`, roundScores.Opponent?.card1 && `${oppT1.group} - ${oppT1.displayCount}`].filter(Boolean),
      card0Success: !!roundScores.You?.card0, 
      card1Success: !!roundScores.You?.card1,
      oppCard0Success: !!roundScores.Opponent?.card0, 
      oppCard1Success: !!roundScores.Opponent?.card1
    };
    const newHistory = [...cleanHistory, entry];
    setHistory(newHistory);
    const updatedHistoryScores = { ...historyRoundScores, [currentTurn]: roundScores };
    setHistoryRoundScores(updatedHistoryScores);
    if (currentTurn < 5) {
      const nextTurn = currentTurn + 1;
      setCurrentTurn(nextTurn);
      setRoundScores(updatedHistoryScores[nextTurn] || { You: {}, Opponent: {} });
    } else { setIsGameOver(true); }
  };

  const handleBack = () => {
    const targetTurn = isGameOver ? 5 : currentTurn - 1;
    if (targetTurn >= 1) {
      setCurrentTurn(targetTurn);
      setIsGameOver(false);
      setRoundScores(historyRoundScores[targetTurn] || { You: {}, Opponent: {} });
    }
  };

  const confirmQuit = () => {
    if (window.confirm("Quitter la partie ?")) {
      ["active_game_session", "game_current_turn", "game_history", "game_round_scores", "game_history_scores", "game_underdog"].forEach(k => localStorage.removeItem(k));
      navigate("/");
    }
  };

  if (isGameOver) {
    const winner = currentTotalYou > currentTotalOpp ? "You" : currentTotalOpp > currentTotalYou ? "Opponent" : "Draw";
    let cumulativeYou = 0; let cumulativeOpp = 0;

    const renderTacticsList = (player) => {
        const tactics = (player === "You" ? session.you : session.opp).tactics;
        return tactics.map((slug, idx) => {
            const data = getTacticLabels(slug, player, history);
            return (
                <div key={idx} className="mb-3">
                    <div className="text-warning tiny fw-bold border-bottom border-secondary mb-1" style={{ fontSize: '0.6rem' }}>{data.group}</div>
                    <ul className="bt-list">
                        {data.allSteps.map((step, sIdx) => {
                            const success = data.historyCount > sIdx || (sIdx === data.historyCount && (player === "You" ? history.find(h => h.round === 5)?.[`card${idx}Success`] : history.find(h => h.round === 5)?.[`oppCard${idx}Success`]));
                            return (
                                <li key={sIdx} className="bt-item d-flex align-items-center">
                                    <span className={success ? "text-success me-1" : "text-danger me-1"}>{success ? "✓" : "✘"}</span>
                                    <span className={success ? "text-white" : "opacity-50"}>{step.toUpperCase()}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            );
        });
    };

    return (
      <div className="min-vh-100 bg-black text-white font-monospace p-3">
        <style>{`.winner-card { position: relative; height: 140px; background-size: cover; background-position: center; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px solid #333; overflow: hidden; }.winner-card-active { border: 2px solid #ffc107 !important; box-shadow: 0 0 20px rgba(255,193,7,0.3); }.card-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%); z-index: 1; }.card-content { position: relative; z-index: 2; }.table-score { width: 100%; border-collapse: separate; border-spacing: 0 4px; font-size: 0.8rem; }.table-score th { color: #666; text-transform: uppercase; font-size: 0.65rem; padding: 8px; border-bottom: 1px solid #222; }
        .table-score td { background: #111; padding: 10px 8px; vertical-align: middle; }.td-round { border-left: 2px solid #ffc107; font-weight: bold; color: #ffc107; width: 40px; text-align: center; }.score-pill { background: #222; padding: 2px 6px; border-radius: 3px; font-weight: bold; }.tactic-success-text { font-size: 0.72rem; font-style: italic; font-weight: bold; margin-top: 2px; display: block; line-height: 1.1; color: #198754; }.bt-list { list-style: none; padding: 0; margin: 0; font-size: 0.7rem; }.bt-item { padding: 4px 0; border-bottom: 1px solid #222; }`}</style>
        <h3 className="text-center text-warning fw-bold mb-4 text-uppercase">Résultat Final</h3>
        <div className="row g-2 mb-4">
          {["You", "Opponent"].map(p => {
            const isY = p === "You";
            const score = isY ? currentTotalYou : currentTotalOpp;
            return (
              <div key={p} className="col-6">
                <div className={`winner-card ${winner === p ? 'winner-card-active' : 'opacity-50'}`} style={{ backgroundImage: `url(/img/banner_${isY ? session.you?.slug : session.opp?.slug}.webp)` }}>
                  <div className="card-overlay"></div>
                  <div className="card-content text-center">
                    <div className="h2 fw-bold m-0">{score}</div>
                    <div className={`fw-bold small ${isY ? "text-info" : "text-danger"}`}>{isY ? "MOI" : "ADV"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="table-responsive mb-4">
          <table className="table-score">
            <thead><tr><th>RD</th><th className="bg-info text-dark text-center">MOI</th><th className="bg-danger text-white text-center">ADV</th></tr></thead>
            <tbody>{history.map((r, i) => { cumulativeYou += r.youTotal; cumulativeOpp += r.oppTotal; return (<tr key={i}><td className="td-round">R{r.round}</td><td><div className="d-flex flex-column"><span className="score-pill">{r.youTotal} PTS</span><span className="text-secondary tiny">Total: {cumulativeYou}</span>{r.tacticYou.map((t, idx) => (<span key={idx} className="tactic-success-text">✓ {t}</span>))}</div></td><td><div className="d-flex flex-column"><span className="score-pill">{r.oppTotal} PTS</span><span className="text-secondary tiny">Total: {cumulativeOpp}</span>{r.tacticOpp.map((t, idx) => (<span key={idx} className="tactic-success-text">✓ {t}</span>))}</div></td></tr>); })}</tbody>
          </table>
        </div>

        <div className="table-responsive mb-4">
            <table className="table-score">
                <thead><tr><th className="bg-info text-dark text-center">MOI</th><th className="bg-danger text-white text-center">ADV</th></tr></thead>
                <tbody>
                    <tr>
                        <td style={{ verticalAlign: 'top', width: '50%' }}>{renderTacticsList("You")}</td>
                        <td style={{ verticalAlign: 'top', width: '50%' }}>{renderTacticsList("Opponent")}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div className="d-grid gap-2">
          <div className="d-flex gap-2 mb-4">
            <button className="btn btn-secondary fw-bold rounded-0 flex-grow-1" onClick={handleBack}>RETOUR</button>
            <button className="btn btn-outline-danger fw-bold rounded-0 flex-grow-1" onClick={() => { if(window.confirm("Quitter ?")) { ["active_game_session", "game_current_turn", "game_history", "game_round_scores", "game_history_scores", "game_underdog"].forEach(k => localStorage.removeItem(k)); navigate("/"); } }}>QUITTER</button>
          </div>
          <button className="btn btn-warning py-3 fw-bold rounded-0 text-dark" onClick={() => { const finalData = { ...session, history, date: new Date().toISOString(), finalScores: { you: currentTotalYou, opp: currentTotalOpp } }; const savedGames = JSON.parse(localStorage.getItem("saved_games") || "[]"); localStorage.setItem("saved_games", JSON.stringify([finalData, ...savedGames])); ["active_game_session", "game_current_turn", "game_history", "game_round_scores", "game_history_scores", "game_underdog"].forEach(k => localStorage.removeItem(k)); navigate("/"); }}>SAUVEGARDER & QUITTER</button>
        </div>
      </div>
    );
  }

  const displayOrder = firstPlayer === "You" ? ["You", "Opponent"] : ["Opponent", "You"];

  return (
    <div className="min-vh-100 bg-black text-white font-monospace pb-5 overflow-x-hidden">
      <style>{`
        .game-header { position: relative; height: 180px; display: flex; border-bottom: 2px solid #000; overflow: hidden; }
        .faction-banner { width: 50%; height: 100%; background-size: cover; background-position: center; }
        .rd-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 3px solid #ffc107; background: #000; width: 60px; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; }
        .score-box { position: absolute; inset: 0; display: flex; justify-content: space-between; align-items: flex-end; padding: 20px; z-index: 11; pointer-events: none; }
        .tactic-btn { height: 55px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px !important; border-radius: 0 !important; margin-bottom: 8px; border: 1px solid #333 !important; }
        .doubleturn-badge { font-size: 0.65rem; color: #fff; background: red; padding: 2px 6px; border: 1px solid red; vertical-align: middle; margin: 0 8px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; border-radius: 2px; }
        .underdog-badge { font-size: 0.65rem; color: #000; background: #ffc107; padding: 2px 6px; border: 1px solid #ffc107; vertical-align: middle; margin: 0 8px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; border-radius: 2px; }
        .btn-quit-header { position: absolute; top: 10px; right: 10px; z-index: 20; background: rgba(0,0,0,0.5); border: 1px solid #444; color: #666; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .tactic-blocked { opacity: 0.3 !important; text-decoration: line-through !important; pointer-events: none; }
        .plan-handle { position: fixed; right: 0; top: 250px; background: #ffc107; color: #000; padding: 12px 5px; border-radius: 5px 0 0 5px; z-index: 2000; writing-mode: vertical-rl; text-orientation: mixed; font-size: 0.65rem; font-weight: bold; cursor: pointer; box-shadow: -2px 0 10px rgba(0,0,0,0.5); }
        .plan-drawer { position: fixed; right: -320px; top: 0; width: 320px; height: 100vh; background: rgba(10,10,10,0.98); z-index: 2001; transition: right 0.3s ease; border-left: 2px solid #ffc107; backdrop-filter: blur(15px); display: flex; flex-direction: column; }
        .plan-drawer.open { right: 0; }
        .plan-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1999; display: none; }
        .plan-overlay.open { display: block; }
        .drawer-content { flex: 1; overflow-y: auto; padding: 20px; scroll-behavior: smooth; }
        .plan-rule-box { background: #1a1a1a; padding: 10px; margin-bottom: 15px; font-size: 0.75rem; }
        .plan-rule-box.passive { border-left-color: #802022; }
        .drawer-tabs { display: flex; border-bottom: 1px solid #333; background: #000; }
        .drawer-tab { flex: 1; padding: 12px; text-align: center; font-size: 0.65rem; font-weight: bold; cursor: pointer; color: #666; text-transform: uppercase; border-bottom: 2px solid transparent; transition: all 0.3s; }
        .drawer-tab.active { color: #ffc107; border-bottom: 2px solid #ffc107; background: rgba(255,193,7,0.05); }
      `}</style>

      {/* BATTLEPLAN DRAWER */}
      <div className={`plan-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
      <div className="plan-handle" onClick={() => setIsDrawerOpen(true)}>BATTLEPLAN</div>
      <div className={`plan-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center bg-black">
          <h6 className="text-warning fw-bold m-0 small text-uppercase">{planName}</h6>
          <button className="btn btn-sm btn-outline-secondary border-0 text-white" onClick={() => setIsDrawerOpen(false)}>×</button>
        </div>

        <div className="drawer-tabs">
          <div className={`drawer-tab ${activeTab === "rules" ? "active" : ""}`} onClick={() => setActiveTab("rules")}>Règles</div>
          <div className={`drawer-tab ${activeTab === "plan" ? "active" : ""}`} onClick={() => setActiveTab("plan")}>Battleplan</div>
          <div className={`drawer-tab ${activeTab === "layout" ? "active" : ""}`} onClick={() => setActiveTab("layout")}>AOSFF Layout</div>
        </div>
        
        <div className="drawer-content custom-scrollbar">
          {activeTab === "rules" && (
            <div className="animate__animated animate__fadeIn">
              <div className="mb-4">
                <div className="text-success tiny fw-bold text-uppercase border-bottom border-success mb-2">Scoring</div>
                <div className="plan-rule-box" style={{ borderLeftColor: '#157f40ff' }}>
                  <div className="opacity-75" style={{ whiteSpace: 'pre-line' }}>{planTexts?.scoring || "Non défini"}</div>
                </div>
              </div>

              <div className="text-info tiny fw-bold text-uppercase border-bottom border-info mb-2">Règles Spéciales</div>
              {planTexts?.twist && (
                <div className="plan-rule-box">
                  <div className="fw-bold text-info text-uppercase mb-1">Twist / Outsider</div>
                  <div className="opacity-75" style={{ whiteSpace: 'pre-line' }}>{planTexts.twist}</div>
                </div>
              )}
              {planTexts?.details && (
                <div className="plan-rule-box passive">
                  <div className="text-info tiny fw-bold text-uppercase mb-1">Détails</div>
                  <div className="opacity-75" style={{ whiteSpace: 'pre-line' }}>{planTexts.details}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === "plan" && (
            <div className="animate__animated animate__fadeIn text-center">
               <img 
                 src={getPlanImagePath()} 
                 className="img-fluid border border-secondary rounded shadow mb-2" 
                 alt="battleplan" 
                 onError={(e) => { e.target.src = "/battleplans/GeneralHandbook_files/default.png"; }} 
               />
              <div className="tiny text-warning fw-bold text-uppercase opacity-50">Illustration Officielle</div>
            </div>
          )}

          {activeTab === "layout" && (
            <div className="animate__animated animate__fadeIn text-center" style={{ height: 'calc(100vh - 200px)' }}>
              <embed
                src={`/battleplans/layouts/${planName?.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                type="application/pdf"
                width="100%"
                height="100%"
                className="rounded border border-secondary"
              />
            </div>
          )}
        </div>
      </div>

      <div className="game-header">
        {currentTurn === 1 && <button className="btn-quit-header" onClick={confirmQuit}>×</button>}
        <div className="faction-banner" style={{ backgroundImage: `url(/img/banner_${session.you?.slug}.webp)`, borderLeft: '3px solid #0dcaf0' }}></div>
        <div className="faction-banner" style={{ backgroundImage: `url(/img/banner_${session.opp?.slug}.webp)`, borderRight: '3px solid #dc3545' }}></div>
        <div className="rd-badge text-warning shadow"><small className="fw-bold">RD</small><div className="h3 fw-bold m-0">{currentTurn}</div></div>
        <div className="score-box">
          <div className="text-center">
            <div className="display-4 fw-bold m-0 text-white">{currentTotalYou}</div>
            <div className="text-info fw-bold small">{session.you?.name} {underdog === "You" && <span className="underdog-badge">UNDERDOG</span>}</div>
          </div>
          <div className="text-center">
            <div className="display-4 fw-bold m-0 text-white">{currentTotalOpp}</div>
            <div className="text-danger fw-bold small">{underdog === "Opponent" && <span className="underdog-badge">UNDERDOG</span>} {session.opp?.name}</div>
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
          const seizing = (p === firstPlayer && didSeizeInitiative);
          return (
            <div key={p} className="mb-4">
              <div className={`d-flex justify-content-between align-items-center border-bottom pb-1 mb-3 ${isYou ? 'border-info' : 'border-danger'}`}>
                <div className="d-flex align-items-center">
                  <span className="fw-bold">{isYou ? session.you.name.toUpperCase() : session.opp.name.toUpperCase()}</span>
                  {underdog === p && <span className="underdog-badge">UNDERDOG</span>}
                  {seizing && <span className="ms-2 doubleturn-badge" style={{fontSize: '0.6rem'}}>SEIZING INITIATIVE</span>}
                </div>
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
                  const cleanHistory = history.filter(h => h.round < currentTurn);
                  const tData = getTacticLabels(isYou ? session.you?.tactics?.[idx] : session.opp?.tactics?.[idx], p, cleanHistory);
                  const active = roundScores[p]?.[`card${idx}`];
                  const isBlocked = tData.completed && !active;
                  return (
                    <div className="col-6" key={idx}>
                      <button disabled={isBlocked || seizing} className={`btn btn-sm w-100 text-start p-2 rounded-0 ${seizing ? 'tactic-blocked btn-dark' : isBlocked ? 'btn-dark opacity-25' : active ? 'btn-success text-white' : 'btn-dark border-secondary text-white'}`}
                        style={{ height: '70px' }} onClick={() => setRoundScores(prev => ({...prev, [p]: {...prev[p], [`card${idx}`]: !prev[p][`card${idx}`]}}))}>
                        <div className="text-start">
                          <small className="opacity-50 d-block" style={{fontSize: '0.6rem'}}>{tData.group} {tData.displayCount}</small>
                          <div className="text-uppercase fw-bold" style={{fontSize: '0.8rem'}}>{seizing ? "BLOCKED" : tData.step}</div>
                        </div>
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
        <button className="btn btn-outline-light rounded-0 px-2" onClick={confirmQuit}>QUITTER</button>
        {currentTurn > 1 && <button className="btn btn-secondary rounded-0 px-3 fw-bold" onClick={handleBack}>RETOUR</button>}
        <button className="btn btn-warning flex-grow-1 py-3 fw-bold rounded-0" onClick={handleNextRound}>
          {currentTurn < 5 ? `FIN ROUND ${currentTurn}` : "VOIR LE RÉSULTAT"}
        </button>
      </div>
    </div>
  );
}