import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { battleplansData } from "../data/battleplansData"; 
import battleTacticsData from "../data/battletactics.json";

export default function GameDashboard() {
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [session, setSession] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [firstPlayer, setFirstPlayer] = useState("You"); 
  const [priorityWinner, setPriorityWinner] = useState("You");
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [roundScores, setRoundScores] = useState({ You: {}, Opponent: {} });

  // --- CHARGEMENT ---
  useEffect(() => {
    const activeSession = JSON.parse(localStorage.getItem("active_game_session"));
    if (!activeSession) { navigate("/"); return; }
    setSession(activeSession);
  }, [navigate]);

  if (!session) return <div className="bg-black vh-100" />;

  // --- CALCULS DE SCORE ---
  const totalPoints = (p) => history.reduce((acc, r) => acc + (p === "You" ? r.youTotal : r.oppTotal), 0);

  const getPlanLogic = () => {
    const name = session.battleplan?.name;
    for (const s in battleplansData) {
      if (battleplansData[s][name]) return battleplansData[s][name];
    }
    return null;
  };

  const planLogic = getPlanLogic();
  
  // LOGIQUE DE FILTRAGE DES SCORES
  const scenarioOptions = (planLogic?.scoringType === "per_objective" 
    ? [1,2,3,4,5].map(n => ({id: `obj_${n}`, label: `Objectif ${n}`, vp: planLogic.vpPerObj}))
    : planLogic?.customOptions || []
  ).filter(opt => {
    const rule = planLogic?.scoringRules?.find(r => r.id === opt.id);
    if (rule && rule.startRound && currentTurn < rule.startRound) return false;
    if (opt.label.includes("R5") && currentTurn < 5) return false;
    return true;
  });

  const calculateTurnScore = (player) => {
    const s = roundScores[player] || {};
    let pts = 0;
    scenarioOptions.forEach(opt => { if (s[opt.id]) pts += opt.vp; });
    if (s.card0) pts += 5;
    if (s.card1) pts += 5;
    return pts;
  };

  // --- LOGIQUE INITIATIVE / UNDERDOG ---
  const checkSeize = (p) => {
    if (currentTurn === 1 || history.length === 0) return false;
    const last = history[history.length - 1];
    const wasSecond = last.youFirst ? (p === "Opponent") : (p === "You");
    const diff = Math.abs(totalPoints("You") - totalPoints("Opponent"));
    return wasSecond && priorityWinner === p && firstPlayer === p && diff < 11;
  };

  const getUnderdog = () => {
    if (checkSeize("You")) return "Opponent";
    if (checkSeize("Opponent")) return "You";
    const pY = totalPoints("You"), pO = totalPoints("Opponent");
    return pY < pO ? "You" : pO < pY ? "Opponent" : null;
  };

  // --- ACTIONS ---
  const handleNextRound = () => {
    const entry = {
      round: currentTurn,
      youTotal: calculateTurnScore("You"),
      oppTotal: calculateTurnScore("Opponent"),
      youFirst: firstPlayer === "You",
      successTacticsYou: [roundScores.You?.card0 ? session.you?.tactics?.[0] : null, roundScores.You?.card1 ? session.you?.tactics?.[1] : null].filter(Boolean),
      successTacticsOpp: [roundScores.Opponent?.card0 ? session.opp?.tactics?.[0] : null, roundScores.Opponent?.card1 ? session.opp?.tactics?.[1] : null].filter(Boolean)
    };
    setHistory([...history, entry]);
    if (currentTurn < 5) {
      setCurrentTurn(currentTurn + 1);
      setRoundScores({ You: {}, Opponent: {} });
    } else setIsGameOver(true);
  };

  const getTacticLabels = (groupSlug, player) => {
    const group = battleTacticsData.find(t => t.id === groupSlug);
    if (!group) return { group: "Tactic", step: "Unknown", count: 0 };
    const count = history.filter(h => player === "You" ? h.successTacticsYou?.includes(groupSlug) : h.successTacticsOpp?.includes(groupSlug)).length;
    const steps = [group.affray, group.strike, group.domination];
    return { group: group.name, step: steps[count] || "MAX ATTAINED", count: count + 1 };
  };

  // --- RENDU ---
  const displayOrder = firstPlayer === "You" ? ["You", "Opponent"] : ["Opponent", "You"];

  if (isGameOver) return (
    <div className="min-vh-100 bg-black text-white p-4 font-monospace text-center d-flex flex-column justify-content-center">
      <h1 className="text-warning display-4 fw-bold mb-5">VICTOIRE FINALE</h1>
      <div className="d-flex justify-content-around mb-5">
        <div><div className="h4 text-info">{session.you?.name}</div><div className="display-1 fw-bold">{totalPoints("You")}</div></div>
        <div className="display-4 text-secondary">VS</div>
        <div><div className="h4 text-danger">{session.opp?.name}</div><div className="display-1 fw-bold">{totalPoints("Opponent")}</div></div>
      </div>
      <button className="btn btn-warning btn-lg rounded-0 fw-bold py-3" onClick={() => navigate("/")}>RETOUR AU MENU</button>
    </div>
  );

  return (
    <div className="min-vh-100 bg-black text-white font-monospace pb-5">
      <style>{`
        .game-header { position: relative; height: 180px; display: flex; border-bottom: 2px solid #444; overflow: hidden; }
        .faction-banner { width: 50%; height: 100%; background-size: cover; background-position: center; opacity: 0.4; }
        .banner-you { border-left: 8px solid #0dcaf0; border-right: 1px solid #333; }
        .banner-opp { border-right: 8px solid #dc3545; border-left: 1px solid #333; transform: scaleX(-1); }
        .rd-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 3px solid #ffc107; background: #000; width: 60px; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 0 15px rgba(0,0,0,0.8); }
        .score-box { position: absolute; inset: 0; display: flex; justify-content: space-between; align-items: flex-end; padding: 20px; z-index: 11; pointer-events: none; }
        .tactic-btn { height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px !important; border-radius: 0 !important; margin-bottom: 8px; border: 1px solid #333 !important; }
        
        .btn-tactic-idle { background: linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%); border-color: #444 !important; }
        .btn-tactic-active { background: #198754 !important; border-color: #198754 !important; }
        
        .underdog-label { font-size: 0.65rem; color: #ffc107; border: 1px solid #ffc107; padding: 2px 6px; font-weight: bold; margin-top: 5px; display: inline-block; }
        
        .tactic-count-badge { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 4px; font-size: 0.55rem; color: #ffc107; margin-left: 6px; display: inline-flex; align-items: center; gap: 4px; }
        .dot-indicator { width: 4px; height: 4px; background: #ffc107; border-radius: 50%; box-shadow: 0 0 4px #ffc107; }
      `}</style>

      {/* HEADER VISUEL */}
      <div className="game-header">
        <div className="faction-banner banner-you" style={{ backgroundImage: `url(/img/banner_${session.you?.slug}.webp)` }}></div>
        <div className="faction-banner banner-opp" style={{ backgroundImage: `url(/img/banner_${session.opp?.slug}.webp)` }}></div>
        <div className="rd-badge text-warning shadow">
          <small className="fw-bold">RD</small>
          <div className="h3 fw-bold m-0">{currentTurn}</div>
        </div>
        <div className="score-box">
          <div className="text-center">
            <div className="display-4 fw-bold m-0" style={{lineHeight: 0.9, textShadow: '2px 2px 4px #000'}}>{totalPoints("You") + calculateTurnScore("You")}</div>
            <div className="text-info fw-bold small mt-1">{session.you?.name}</div>
            {getUnderdog() === "You" && <span className="underdog-label">UNDERDOG</span>}
          </div>
          <div className="text-center">
            <div className="display-4 fw-bold m-0" style={{lineHeight: 0.9, textShadow: '2px 2px 4px #000'}}>{totalPoints("Opponent") + calculateTurnScore("Opponent")}</div>
            <div className="text-danger fw-bold small mt-1">{session.opp?.name}</div>
            {getUnderdog() === "Opponent" && <span className="underdog-label">UNDERDOG</span>}
          </div>
        </div>
      </div>

      <div className="p-3">
        {/* ORDRE DU TOUR ET PRIORITÉ */}
        <div className="bg-dark bg-opacity-50 p-2 mb-4 border border-secondary border-opacity-25">
          <div className="row g-1">
            <div className="col-6">
                <button className={`btn btn-sm w-100 rounded-0 ${priorityWinner === "You" ? "btn-info text-dark fw-bold" : "btn-dark text-white"}`} onClick={() => setPriorityWinner("You")}>PRIO: YOU</button>
            </div>
            <div className="col-6">
                <button className={`btn btn-sm w-100 rounded-0 ${priorityWinner === "Opponent" ? "btn-danger text-white fw-bold" : "btn-dark text-white"}`} onClick={() => setPriorityWinner("Opponent")}>PRIO: OPP</button>
            </div>
            <div className="col-6 mt-1">
                <button className={`btn btn-sm w-100 rounded-0 ${firstPlayer === "You" ? "btn-info text-dark fw-bold" : "btn-dark text-white"}`} onClick={() => setFirstPlayer("You")}>1ST: YOU</button>
                {checkSeize("You") && <div className="text-danger text-center fw-bold mt-1" style={{fontSize: '0.5rem'}}>SEIZING INITIATIVE</div>}
            </div>
            <div className="col-6 mt-1">
                <button className={`btn btn-sm w-100 rounded-0 ${firstPlayer === "Opponent" ? "btn-danger text-white fw-bold" : "btn-dark text-white"}`} onClick={() => setFirstPlayer("Opponent")}>1ST: OPP</button>
                {checkSeize("Opponent") && <div className="text-danger text-center fw-bold mt-1" style={{fontSize: '0.5rem'}}>SEIZING INITIATIVE</div>}
            </div>
          </div>
        </div>

        {/* BLOCS JOUEURS DYNAMIQUES */}
        {displayOrder.map(p => {
          const isYou = (p === "You");
          const blocked = checkSeize(p);
          const pInfo = isYou ? session.you : session.opp;
          const score = calculateTurnScore(p);

          return (
            <div key={p} className="mb-5">
              <div className={`d-flex justify-content-between border-bottom pb-1 mb-3 ${isYou ? 'border-info' : 'border-danger'}`}>
                <span className={`fw-bold ${isYou ? 'text-info' : 'text-danger'}`}>{pInfo?.name?.toUpperCase()}</span>
                <span className="text-warning fw-bold">{score} PTS</span>
              </div>

              {/* SCÉNARIO (FILTRAGE ACTIF) */}
              {scenarioOptions.map(opt => (
                <button key={opt.id} className={`btn btn-sm w-100 tactic-btn ${roundScores[p]?.[opt.id] ? (isYou ? 'btn-info text-dark fw-bold' : 'btn-danger text-white fw-bold') : 'btn-dark text-white'}`}
                  onClick={() => setRoundScores(prev => ({...prev, [p]: {...prev[p], [opt.id]: !prev[p][opt.id]}}))}>
                  <span className="fw-bold">{opt.label}</span>
                  <span className="badge bg-black text-white border border-secondary">+{opt.vp}</span>
                </button>
              ))}

              {/* TACTIQUES */}
              <div className="mt-2">
                {[0, 1].map(idx => {
                  const tData = getTacticLabels(pInfo?.tactics?.[idx], p);
                  const active = roundScores[p]?.[`card${idx}`];
                  return (
                    <button key={idx} disabled={blocked} 
                      className={`btn btn-sm w-100 tactic-btn ${blocked ? 'opacity-25' : active ? 'btn-tactic-active text-white fw-bold' : 'btn-tactic-idle text-white'}`}
                      style={{ height: '70px' }}
                      onClick={() => setRoundScores(prev => ({...prev, [p]: {...prev[p], [`card${idx}`]: !prev[p][`card${idx}`]}}))}>
                      <div className="text-start">
                        <div className="d-flex align-items-center mb-1">
                            <small className="text-white opacity-50" style={{fontSize: '0.6rem'}}>{tData.group}</small>
                            <span className="tactic-count-badge">
                                <span className="dot-indicator"></span>
                                {tData.count}/3
                            </span>
                        </div>
                        <div className="text-uppercase fw-bold text-white" style={{fontSize: '0.9rem', letterSpacing: '0.5px'}}>{tData.step}</div>
                      </div>
                      <div className="fw-bold text-white">{blocked ? 'BLOCKED' : '+5 PTS'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed-bottom p-3 bg-black border-top border-secondary d-flex gap-2">
        <button className="btn btn-outline-light rounded-0 px-4" onClick={() => navigate("/")}>QUITTER</button>
        <button className="btn btn-warning flex-grow-1 py-3 fw-bold rounded-0" onClick={handleNextRound}>
          {currentTurn < 5 ? `TERMINER ROUND ${currentTurn}` : "VOIR LE RÉSULTAT"}
        </button>
      </div>
    </div>
  );
}