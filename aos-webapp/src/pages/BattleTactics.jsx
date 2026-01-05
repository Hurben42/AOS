import React from 'react';
import { Link } from 'react-router-dom';
import battletacticsData from '../data/battletactics.json';

export default function BattleTactics() {
  
  const cleanHtml = (html) => {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Reconstruction des tableaux customTable pour le look AoS
    const tables = doc.querySelectorAll('table.customTable');
    tables.forEach(table => {
      // On force le style pour qu'il match le design sombre
      table.setAttribute('width', '100%');
      table.style.borderCollapse = 'collapse';
      table.style.margin = '10px 0';
      
      const tds = table.querySelectorAll('td');
      tds.forEach(td => {
        td.style.padding = '12px';
        td.style.border = '1px solid #444';
        td.style.backgroundColor = 'rgba(0,0,0,0.2)';
        td.style.color = '#eee';
      });
    });

    return doc.body.innerHTML;
  };

  return (
    <div className="container py-4 min-vh-100">
      <div className="mb-5">
        <Link to="/" className="btn btn-outline-light btn-sm mb-4 px-3">← Retour Accueil</Link>
        
        {/* Header - Utilisation d'une bannière appropriée */}
        <div 
          className="p-5 rounded-3 shadow text-center text-md-start battletactic-header"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.8)), url('/img/banner_seraphon.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h1 className="text-white fw-bold display-4 mb-0 shadow-text">BATTLE TACTICS</h1>
          <p className="text-warning fs-4 mb-0 text-uppercase fw-light">Saison 2025-2026</p>
        </div>
      </div>

      <div className="accordion shadow-lg" id="accordionTactics">
        {battletacticsData.map((bt, index) => (
          <div className="accordion-item bg-dark text-white mb-2 rounded-2" key={bt.id}>
            <h2 className="accordion-header">
              <button 
                className="accordion-button collapsed bg-dark text-white fw-bold py-3" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target={`#collapse${index}`}
              >
                <div className="d-flex align-items-center">
                  <span className="badge bg-warning fs-small text-dark me-3">TACTIC {index + 1}</span>
                  <span className="fs-5">{bt.name}</span>
                </div>
              </button>
            </h2>
            <div id={`collapse${index}`} className="accordion-collapse collapse" data-bs-parent="#accordionTactics">
              <div className="accordion-body bg-dark text-light p-4">
                <div className="row">
                  <div className="col-12">
                    <h4 className="fw-bold text-white text-uppercase pb-2 mb-3">
                      {bt.name}
                    </h4>
                    
                    {/* Description de la tactique */}
                    <div className="battletactic-content mb-4">
                      <div dangerouslySetInnerHTML={{ __html: cleanHtml(bt.description) }} />
                    </div>

                    {/* Tableau des règles (Rules Table) */}
                    {bt.rulesTable && (
                      <div className="battletactic-rules-table mt-3">
                        <div dangerouslySetInnerHTML={{ __html: cleanHtml(bt.rulesTable) }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .shadow-text {
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
        }
        .battletactic-content {
          color: #ccc;
          line-height: 1.6;
          font-size: 1.05rem;
        }
        .battletactic-content p {
          margin-bottom: 1rem;
        }
        .accordion-button:not(.collapsed) {
          background-color: #212529 !important;
          color: #ffc107 !important;
        }
        .accordion-button::after { filter: invert(1); }
        .accordion-item:first-of-type>.accordion-header .accordion-button {
          border:0 !important;
        }
        .battletactic-rules-table table {
          border: none !important;
        }
        /* Effet au survol de l'item */
        .accordion-item {
          transition: border-color 0.3s ease;
        }
      `}</style>
    </div>
  );
}