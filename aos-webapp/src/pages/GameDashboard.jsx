import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { battleplansData } from "../data/battleplansData";

export default function GameDashboard() {
  const navigate = useNavigate();
  
  // --- ÉTATS DE SESSION & NAVIGATION ---
  const [session, setSession] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [firstPlayer, setFirstPlayer] = useState("You");
  const [tacticModal, setTacticModal] = useState({ show: false, player: null, group: null });
  const [history, setHistory] = useState([]);

  // --- ÉTATS DU ROUND ---
  const [roundScores, setRoundScores] = useState({
    You: { obj1: false, obj2: false, objMore: false, objSpecial: false, tacticA: false, tacticB: false },
    Opponent: { obj1: false, obj2: false, objMore: false, objSpecial: false, tacticA: false, tacticB: false }
  });

  // --- PROGRESSION DES TACTIQUES ---
  const [tacticProgress, setTacticProgress] = useState({
    You: { groupA: 0, groupB: 0 },
    Opponent: { groupA: 0, groupB: 0 }
  });

  useEffect(() => {
    const activeSession = JSON.parse(localStorage.getItem("active_game_session"));
    if (!activeSession) { navigate("/start-game"); return; }
    setSession(activeSession);
    
    // Si on revient sur une partie en cours, on pourrait charger l'historique ici
  }, [navigate]);

  if (!session) return null;

  const plan = battleplansData["Passing Seasons"][session.battleplan?.name];
  const myTactics = session.armyList?.selectedTactics || [
    { name: "Saison Tactic 1", steps: ["Affray", "Strike", "Domination"] },
    { name: "Saison Tactic 2", steps: ["Affray", "Strike", "Domination"] }
  ];

  // --- LOGIQUE DOUBLE TOUR & UNDERDOG ---
  const lastRound = history.find(h => h.round === currentTurn - 1);
  const lastPlayerOfPrevRound = lastRound ? (lastRound.youFirst ? "Opponent" : "You") : null;
  const isDoubleTurn = (p) => currentTurn > 1 && firstPlayer === p && lastPlayerOfPrevRound === p;

  const totalYou = history.reduce((acc, r) => acc + r.you, 0);
  const totalOpp = history.reduce((acc, r) => acc + r.opp, 0);

  const calculateVP = (player, data) => {
    let total = 0;
    const s = data[player];
    if (s.obj1) total += plan.customOptions[0].vp;
    if (s.obj2) total += plan.customOptions[1].vp;
    if (s.objMore) total += plan.customOptions[2].vp;
    if (s.objSpecial && plan.customOptions[3]) total += plan.customOptions[3].vp;
    
    if (!isDoubleTurn(player)) {
      if (s.tacticA) total += 5;
      if (s.tacticB) total += 5;
    }
    return total;
  };

  const handleNextRound = () => {
    const roundSummary = {
      round: currentTurn,
      you: calculateVP("You", roundScores),
      opp: calculateVP("Opponent", roundScores),
      youFirst: firstPlayer === "You",
      roundScoresState: { ...roundScores }
    };

    setHistory([...history, roundSummary]);
    
    // Update progression
    setTacticProgress(prev => ({
      You: { 
        groupA: roundScores.You.tacticA ? Math.min(3, prev.You.groupA + 1) : prev.You.groupA,
        groupB: roundScores.You.tacticB ? Math.min(3, prev.You.groupB + 1) : prev.You.groupB
      },
      Opponent: {
        groupA: roundScores.Opponent.tacticA ? Math.min(3, prev.Opponent.groupA + 1) : prev.Opponent.groupA,
        groupB: roundScores.Opponent.tacticB ? Math.min(3, prev.Opponent.groupB + 1) : prev.Opponent.groupB
      }
    }));

    if (currentTurn < 5) {
      setCurrentTurn(currentTurn + 1);
      setRoundScores({
        You: { obj1: false, obj2: false, objMore: false, objSpecial: false, tacticA: false, tacticB: false },
        Opponent: { obj1: false, obj2: false, objMore: false, objSpecial: false, tacticA: false, tacticB: false }
      });
    }
  };

  // --- RENDU CARTE JOUEUR ---
  const renderPlayerCard = (player) => {
    const isYou = player === "You";
    const isActiveDT = isDoubleTurn(player);
    const scoreRound = calculateVP(player, roundScores);
    const underdog = currentTurn > 1 && (isActiveDT ? (isYou ? false : true) : (isYou ? totalYou < totalOpp : totalOpp < totalYou));

    return (
      <div key={player} className={`card-aos mb-3 ${underdog ? 'border-danger shadow-sm' : ''}`}>
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-25 bg-black">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold small-caps tracking-wider text-white">
              {isYou ? "MY TURN" : "OPPONENT TURN"}
            </span>
            {isActiveDT && <span className="badge border border-danger text-danger bg-transparent" style={{fontSize: '0.6rem'}}>DOUBLE TURN</span>}
            {underdog && <span className="badge bg-danger text-white border-0" style={{fontSize: '0.6rem'}}>UNDERDOG</span>}
          </div>
          <div className="text-gold fw-bold fs-5">{scoreRound} VP</div>
        </div>

        <div className="p-3 bg-dark bg-opacity-25">
          <div className="mb-4">
            <div className="d-flex flex-column gap-2">
              {plan.customOptions.map((opt, idx) => {
                const key = ['obj1','obj2','objMore','objSpecial'][idx];
                const active = roundScores[player][key];
                return (
                  <button key={idx} 
                    className={`btn btn-sm text-start d-flex justify-content-between p-3 ${active ? 'btn-aos-active' : 'btn-aos-outline'}`}
                    onClick={() => setRoundScores(prev => ({...prev, [player]: {...prev[player], [key]: !prev[player][key] }}))}
                  >
                    <span className="small-caps">{active && "✓ "} {opt.label}</span>
                    <span className="fw-bold">+{opt.vp}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="row g-2">
            {['tacticA', 'tacticB'].map((tKey, idx) => {
              const active = roundScores[player][tKey];
              const group = tKey === 'tacticA' ? 'groupA' : 'groupB';
              const name = isYou ? myTactics[idx]?.name : `Tactic ${idx+1}`;
              return (
                <div className="col-6" key={tKey}>
                  <button 
                    className={`btn btn-sm w-100 py-3 ${active ? 'btn-aos-active' : 'btn-aos-outline'} ${isActiveDT ? 'opacity-25' : ''}`}
                    disabled={isActiveDT}
                    onClick={() => setTacticModal({ show: true, player, group })}
                  >
                    <div className="small-caps" style={{fontSize: '0.7rem'}}>{active ? "✓ " + name : name}</div>
                    <div className="fw-bold text-success" style={{fontSize: '0.6rem'}}>+5 VP</div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const playersOrdered = firstPlayer === "You" ? ["You", "Opponent"] : ["Opponent", "You"];

  return (
    <div className="min-vh-100 bg-app text-white p-3 font-monospace">
      
      {/* HEADER AVEC FOND DE FACTION */}
      <div className="faction-bg-header rounded border border-secondary border-opacity-50 mb-4 shadow-lg">
        <div className="faction-left" style={{ backgroundImage: `url(${session.armyList?.factionImage || ''})` }}></div>
        <div className="faction-right" style={{ backgroundImage: `url(https://aos-webapp.pages.dev/images/factions/destruction-bg.jpg)` }}></div>
        
        <div className="header-content d-flex justify-content-between align-items-center p-3">
          <div className="text-center">
            <div className="small-caps text-secondary mb-1" style={{fontSize: '0.7rem'}}>YOU</div>
            <div className="h2 mb-0 fw-bold text-white tracking-tighter">
                {totalYou + (currentTurn > history.length ? calculateVP("You", roundScores) : 0)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-warning fw-bold small-caps letter-spacing-2" style={{fontSize: '0.9rem'}}>ROUND {currentTurn}</div>
          </div>

          <div className="text-center">
            <div className="small-caps text-secondary mb-1" style={{fontSize: '0.7rem'}}>OPP</div>
            <div className="h2 mb-0 fw-bold text-white tracking-tighter">
                {totalOpp + (currentTurn > history.length ? calculateVP("Opponent", roundScores) : 0)}
            </div>
          </div>
        </div>
      </div>

      {/* SÉLECTEUR D'ORDRE */}
      <div className="card-aos p-2 mb-4 bg-black d-flex justify-content-between align-items-center px-3">
        <button className={`btn btn-sm text-muted p-0 ${currentTurn === 1 ? 'invisible' : ''}`} onClick={() => setCurrentTurn(currentTurn-1)}>PREV</button>
        <div className="btn-group border border-secondary p-1 rounded bg-dark" style={{maxWidth: '250px'}}>
            <button className={`btn btn-xs px-3 py-1 ${firstPlayer === "You" ? 'bg-white text-black' : 'text-muted opacity-50'}`} onClick={() => setFirstPlayer("You")}>YOU START</button>
            <button className={`btn btn-xs px-3 py-1 ${firstPlayer === "Opponent" ? 'bg-white text-black' : 'text-secondary opacity-30'}`} onClick={() => setFirstPlayer("Opponent")}>OPP START</button>
        </div>
        <div style={{width: 30}}></div>
      </div>

      {/* CARDS JOUEURS RÉORDONNÉES */}
      <div className="d-flex flex-column gap-2">
        {playersOrdered.map(player => renderPlayerCard(player))}
      </div>

      <button className="btn btn-outline-warning w-100 py-3 mt-4 small-caps fw-bold letter-spacing-2" onClick={handleNextRound}>
        Complete Round {currentTurn}
      </button>

      {/* MODALE TACTIQUE */}
      {tacticModal.show && (
        <div className="modal show d-block p-3" style={{backgroundColor:'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-app border border-secondary shadow-lg">
              <div className="modal-header border-secondary bg-black">
                <h6 className="modal-title text-gold small-caps tracking-widest">Select Battle Tactic</h6>
                <button className="btn-close btn-close-white" onClick={() => setTacticModal({show:false})}></button>
              </div>
              <div className="modal-body p-4">
                {["I. Affray", "II. Strike", "III. Domination"].map((name, idx) => {
                   const progress = tacticProgress[tacticModal.player][tacticModal.group];
                   const isCurrent = idx === progress;
                   const isDone = idx < progress;
                   const isSelected = roundScores[tacticModal.player][tacticModal.group === 'groupA' ? 'tacticA' : 'tacticB'];

                   return (
                     <div key={idx} className={`p-3 mb-3 rounded border ${isCurrent ? (isSelected ? 'border-success bg-success bg-opacity-10' : 'btn-aos-outline') : 'opacity-25 border-secondary'}`}>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className={`fw-bold small-caps ${isCurrent ? 'text-gold' : ''}`}>{name}</span>
                            {isDone && <span className="text-success small">✓ DONE</span>}
                        </div>
                        {isCurrent && (
                            <button className={`btn btn-sm w-100 mt-3 py-2 ${isSelected ? 'btn-success' : 'btn-outline-warning'}`}
                                onClick={() => {
                                    const key = tacticModal.group === 'groupA' ? 'tacticA' : 'tacticB';
                                    setRoundScores(prev => ({...prev, [tacticModal.player]: {...prev[tacticModal.player], [key]: !prev[tacticModal.player][key] }}));
                                    setTacticModal({show:false});
                                }}>
                                {isSelected ? "✓ SELECTED (+5 VP)" : "VALIDATE"}
                            </button>
                        )}
                     </div>
                   );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}