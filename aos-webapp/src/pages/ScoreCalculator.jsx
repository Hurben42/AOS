import React, { useState, useEffect } from "react";
import { battleplansData } from "../data/battleplansData";

export default function ScoreCalculator({ session, currentTurn, onScoreUpdate }) {
  const plan = battleplansData["Passing Seasons"][session.battleplan?.name];
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [tacticDone, setTacticDone] = useState(false);
  const [doubleTurn, setDoubleTurn] = useState(false);
  const [tacticStep, setTacticStep] = useState(0); // 0: Affray, 1: Strike, 2: Domination
  const tactics = ["I. Affray", "II. Strike", "III. Domination"];

  // Reset par round
  useEffect(() => {
    setSelectedOptions([]);
    setTacticDone(false);
    setDoubleTurn(false);
  }, [currentTurn]);

  const toggleOption = (opt) => {
    let newOptions = selectedOptions.includes(opt.id) 
      ? selectedOptions.filter(id => id !== opt.id)
      : [...selectedOptions, opt.id];
    setSelectedOptions(newOptions);
    calculateTotal(newOptions, tacticDone);
  };

  const calculateTotal = (opts, tactic) => {
    let total = 0;
    // Points Objectifs
    plan?.customOptions?.forEach(o => {
      if (opts.includes(o.id)) total += o.vp;
    });
    // Points Tactique
    if (tactic && !doubleTurn) total += 4;
    
    onScoreUpdate(total);
  };

  return (
    <div className="card bg-dark border-secondary shadow-lg mb-4">
      <div className="card-header bg-black d-flex justify-content-between align-items-center py-3">
        <h6 className="mb-0 text-info fw-bold">SCORING ROUND {currentTurn}</h6>
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" checked={doubleTurn} onChange={() => setDoubleTurn(!doubleTurn)} />
          <label className="small text-danger ms-1">Double Tour</label>
        </div>
      </div>
      
      <div className="card-body">
        {/* OBJECTIFS */}
        <div className="mb-4">
          <label className="text-secondary small-caps d-block mb-2">Objectifs de Bataille</label>
          <div className="d-grid gap-2">
            {plan?.customOptions?.map(opt => (
              <button 
                key={opt.id}
                onClick={() => toggleOption(opt)}
                className={`btn text-start d-flex justify-content-between ${selectedOptions.includes(opt.id) ? 'btn-info' : 'btn-outline-secondary'}`}
              >
                <span>{opt.label}</span>
                <span className="fw-bold">+{opt.vp}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TACTIQUES */}
        <div className="mb-3">
          <label className="text-secondary small-caps d-block mb-2">Tactique de Saison</label>
          {doubleTurn ? (
             <div className="alert alert-danger py-2 small mb-0">Pas de tactique (Double Tour pris)</div>
          ) : (
            <button 
              disabled={tacticStep > 2}
              onClick={() => {
                const newState = !tacticDone;
                setTacticDone(newState);
                if (newState) setTacticStep(prev => prev + 1);
                else setTacticStep(prev => prev - 1);
                calculateTotal(selectedOptions, newState);
              }}
              className={`btn w-100 py-3 fw-bold ${tacticDone ? 'btn-success' : 'btn-outline-success'}`}
            >
              {tacticStep > 2 ? "🎯 TOUTES RÉUSSIES" : tactics[tacticStep] + " (+4 VP)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}