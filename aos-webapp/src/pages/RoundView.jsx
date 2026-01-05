import React, { useState, useEffect } from "react";
import { battleplansData } from "../data/battleplansData";

export default function RoundView({ session, currentTurn, currentScore, opponentScore, onScoreUpdate }) {
  const plan = battleplansData["Passing Seasons"][session.battleplan?.name];
  const isUnderdog = currentScore < opponentScore;

  // États locaux du round
  const [vpObj, setVpObj] = useState(0);
  const [tacticValid, setTacticValid] = useState(false);
  const [doubleTurn, setDoubleTurn] = useState(false);

  // Sync avec le parent
  useEffect(() => {
    let total = vpObj + (tacticValid && !doubleTurn ? 4 : 0);
    onScoreUpdate(total);
  }, [vpObj, tacticValid, doubleTurn]);

  return (
    <div className="round-container d-flex flex-column gap-3">
      
      {/* 1. CARTE UNDERDOG (Dynamique) */}
      {isUnderdog && plan.twist && (
        <div className="card border-danger bg-danger bg-opacity-10 shadow-sm">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-start">
              <h6 className="text-danger fw-bold mb-1">🎁 CAPACITÉ UNDERDOG</h6>
              <span className="badge bg-danger">ACTIF</span>
            </div>
            <p className="small text-white mb-0 italic">{plan.twist.effect(currentTurn)}</p>
          </div>
        </div>
      )}

      {/* 2. SECTION OBJECTIFS (Style Tabletop: Boutons Score) */}
      <div className="card bg-dark border-secondary shadow-sm">
        <div className="card-header bg-black text-info small-caps fw-bold py-2">Objectifs</div>
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-white">Points d'objectifs</span>
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-outline-light btn-sm rounded-circle" style={{width:'32px'}} onClick={() => setVpObj(Math.max(0, vpObj - 1))}>-</button>
              <h4 className="mb-0 fw-bold" style={{minWidth: '30px', textAlign: 'center'}}>{vpObj}</h4>
              <button className="btn btn-outline-light btn-sm rounded-circle" style={{width:'32px'}} onClick={() => setVpObj(vpObj + 1)}>+</button>
            </div>
          </div>
          <div className="mt-2 text-muted small italic border-top border-secondary pt-2">
            Rappel : {plan.scoringDesc}
          </div>
        </div>
      </div>

      {/* 3. SECTION TACTIQUE (Style Tabletop: Checkbox) */}
      <div className={`card ${tacticValid ? 'border-success' : 'border-secondary'} bg-dark shadow-sm`}>
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div>
            <h6 className={`mb-0 ${tacticValid ? 'text-success' : 'text-white'}`}>Tactique de Bataille</h6>
            <small className="text-muted">Étape : {tacticValid ? "Terminée" : "À valider"}</small>
          </div>
          <div className="d-flex align-items-center gap-3">
            {doubleTurn ? (
              <span className="badge bg-danger">BLOQUÉ</span>
            ) : (
              <input 
                type="checkbox" 
                className="form-check-input btn-check" 
                id="btn-check-tactic"
                checked={tacticValid}
                onChange={() => setTacticValid(!tacticValid)}
              />
            )}
            <label 
              className={`btn ${tacticValid ? 'btn-success' : 'btn-outline-secondary'} rounded-pill px-4 fw-bold`} 
              htmlFor="btn-check-tactic"
              onClick={() => !doubleTurn && setTacticValid(!tacticValid)}
            >
              {tacticValid ? "✓ +4 VP" : "NON FAIT"}
            </label>
          </div>
        </div>
      </div>

      {/* 4. DOUBLE TOUR (Le switch de pénalité) */}
      <div className="card bg-black border-danger border-opacity-25">
        <div className="card-body p-2 d-flex justify-content-between align-items-center">
          <span className="small text-danger fw-bold">⚠️ DOUBLE TOUR PRIS ?</span>
          <div className="form-check form-switch">
            <input 
                className="form-check-input" 
                type="checkbox" 
                checked={doubleTurn} 
                onChange={() => {
                    setDoubleTurn(!doubleTurn);
                    if(!doubleTurn) setTacticValid(false);
                }} 
            />
          </div>
        </div>
      </div>

    </div>
  );
}