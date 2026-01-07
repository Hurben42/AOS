import React from 'react';
import { Link } from 'react-router-dom';
import battletacticsData from '../data/battletactics.json';

export default function BattleTactics() {
  
  // Nettoie les liens Wahapedia et autres balises inutiles pour l'affichage
  const cleanHtml = (html) => {
    if (!html) return "";
    return html
      .replace(/<a href=".*?">(.*?)<\/a>/g, '$1') // Enlève les liens mais garde le texte
      .replace(/<span class="tooltip.*?">(.*?)<\/span>/g, '$1'); // Enlève les spans de tooltip
  };

  return (
    <div className="container py-4 min-vh-100 font-monospace bg-black text-white">
      <div className="mb-5">
        <Link to="/" className="btn btn-outline-warning btn-sm mb-4 px-3 rounded-0">← RETOUR ACCUEIL</Link>
        
        <div 
          className="p-5 rounded-0 shadow text-center text-md-start border border-warning border-opacity-25"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.9)), url('/img/banner_seraphon.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h1 className="text-white fw-bold display-4 mb-0 shadow-text">BATTLE TACTICS</h1>
          <p className="text-warning fs-5 mb-0 text-uppercase fw-light">Saison 2025-2026</p>
        </div>
      </div>

      <div className="accordion" id="accordionTactics">
        {battletacticsData.map((bt, index) => (
          <div className="accordion-item bg-black text-white mb-3 rounded-0 border-secondary" key={bt.id}>
            <h2 className="accordion-header">
              <button 
                className="accordion-button collapsed bg-dark text-white fw-bold py-3 px-4 shadow-none" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target={`#collapse${index}`}
              >
                <div className="d-flex align-items-center">
                  <span className="badge border border-warning text-warning me-3" style={{fontSize: '0.7rem'}}>CARTE {index + 1}</span>
                  <span className="fs-5 text-uppercase">{bt.name}</span>
                </div>
              </button>
            </h2>
            <div id={`collapse${index}`} className="accordion-collapse collapse" data-bs-parent="#accordionTactics">
              <div className="accordion-body bg-black text-light p-4 pt-0">
                
                {/* Description d'ambiance de la carte */}
                <div className="battletactic-intro mb-4 p-3 border-start border-warning bg-dark bg-opacity-25">
                  <div dangerouslySetInnerHTML={{ __html: bt.description }} />
                </div>

                {/* Grille des 3 étapes détaillées */}
                <div className="row g-3">
                  {[
                    { label: 'AFFRAY', title: bt.affray, rules: bt.affray_rules, color: '#0dcaf0' },
                    { label: 'STRIKE', title: bt.strike, rules: bt.strike_rules, color: '#ffc107' },
                    { label: 'DOMINATION', title: bt.domination, rules: bt.domination_rules, color: '#ff4444' }
                  ].map((step, i) => (
                    <div className="col-12" key={i}>
                      <div className="p-3 border border-secondary bg-dark bg-opacity-10 rounded-0 h-100">
                        <div className="d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-50 pb-2 mb-2">
                           <small style={{ color: step.color, fontWeight: 'bold', letterSpacing: '1px' }}>{step.label}</small>
                           <span className="badge bg-warning text-dark fw-bold">+5 PTS</span>
                        </div>
                        <div className="fw-bold text-white text-uppercase mb-2" style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                            {step.title || "---"}
                        </div>
                        <div 
                          className="rule-content small" 
                          dangerouslySetInnerHTML={{ __html: cleanHtml(step.rules) }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .shadow-text { text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8); }
        
        .battletactic-intro { 
            font-size: 0.9rem; 
            line-height: 1.4; 
            font-style: italic;
            color: #aaa;
        }

        .rule-content {
            line-height: 1.6;
            color: #ddd;
        }

        .rule-content i {
            display: block;
            color: #888;
            margin-bottom: 8px;
            border-bottom: 1px solid #333;
            padding-bottom: 4px;
        }

        .rule-content b {
            color: #ffc107;
        }

        .rule-content .kwb {
            color: #0dcaf0;
            font-weight: bold;
        }

        .accordion-button:not(.collapsed) {
          background-color: #111 !important;
          color: #ffc107 !important;
        }

        .accordion-button::after { 
            filter: invert(1); 
        }

        .accordion-item { 
            border: 1px solid #333 !important; 
        }

        .accordion-button { 
            border-radius: 0 !important; 
        }

        /* Style pour les listes dans les règles */
        .rule-content ul {
            padding-left: 1.2rem;
            margin-top: 10px;
        }
      `}</style>
    </div>
  );
}