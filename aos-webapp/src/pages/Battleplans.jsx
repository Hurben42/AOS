import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import battleplansData from '../data/battleplans.json';

export default function Battleplans() {
  // État pour gérer l'affichage du PDF dans la modal
  const [selectedPdf, setSelectedPdf] = useState(null);

  const table1 = battleplansData.filter(bp => bp.info.toLowerCase().includes('table 1'));
  const table2 = battleplansData.filter(bp => bp.info.toLowerCase().includes('table 2'));

  const cleanHtml = (html) => {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Supprimer les balises <a> mais garder leur texte
    const links = doc.querySelectorAll('a');
    links.forEach(a => {
      const textNode = doc.createTextNode(a.textContent);
      a.parentNode.replaceChild(textNode, a);
    });

    // 2. Reconstruction des tableaux .abHeader
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
      const header = table.querySelector('.abHeader');
      if (header) {
        header.querySelectorAll('img').forEach(img => img.remove());
        const cleanContent = header.innerHTML;
        table.innerHTML = `<tbody><tr><td class="abHeader" bgcolor="#000000" style="padding:10px; color:#ffc107; font-weight:bold; text-transform:uppercase;">${cleanContent}</td></tr></tbody>`;
      }
    });

    // 3. Nettoyage des résidus de mise en page
    const allTds = doc.querySelectorAll('td');
    allTds.forEach(td => {
        td.removeAttribute('background');
        if (td.style.width === "10px" || td.getAttribute('width') === "10px") {
            td.remove();
        }
    });

    return doc.body.innerHTML;
  };

  const renderAccordion = (plans, idPrefix, title) => (
    <div className="mb-5">
      <h3 className="text-white fw-bold mb-3 border-bottom border-secondary pb-2 text-uppercase">
        {title}
      </h3>
      <div className="accordion shadow-lg" id={`accordion${idPrefix}`}>
        {plans.map((bp, index) => (
          <div className="accordion-item bg-dark text-white mb-2 rounded-2" key={bp.id}>
            <h2 className="accordion-header">
              <button 
                className="accordion-button collapsed bg-dark text-white fw-bold py-3" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target={`#collapse${idPrefix}${index}`}
              >
                <div className="d-flex align-items-center">
                  <span className="badge bg-info text-dark me-3">{bp.info.split('(')[0].trim()}</span>
                  <span className="fs-5">{bp.name}</span>
                </div>
              </button>
            </h2>
            <div id={`collapse${idPrefix}${index}`} className="accordion-collapse collapse" data-bs-parent={`#accordion${idPrefix}`}>
              <div className="accordion-body bg-dark text-light p-0">
                <div className="row g-0">
                  <div className="col-12 p-4">
                    <h4 className="fw-bold text-white text-uppercase pb-2 mb-3">{bp.name}</h4>
                    <div className="battleplan-original-html">
                      <div dangerouslySetInnerHTML={{ __html: cleanHtml(bp.description) }} />
                    </div>
                  </div>
                  
                  {/* Section Image + Bouton Layout */}
                  <div className="col-12 p-3 bg-black border-top border-secondary">
                    <div className="d-flex flex-column align-items-center">
                        <img 
                          src={bp.image} 
                          alt={bp.name} 
                          className="img-fluid rounded shadow-sm border mb-3" 
                          style={{ maxHeight: '600px', objectFit: 'contain' }} 
                        />
                        
                        {/* Carte cliquable pour le Layout */}
                        <div 
                            className="layout-card"
                            onClick={() => window.open(`/battleplans/layouts/${bp.id}.pdf`, '_blank')}
                        >
                          <div className="d-flex align-items-center justify-content-center py-2 px-4">
                             <span className="me-2 text-info">📄</span>
                             <span className="fw-bold text-uppercase" style={{fontSize: '0.85rem'}}>Consulter le Layout AOSFF</span>
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container py-4 min-vh-100">
      <div className="mb-5">
        <Link to="/" className="btn btn-outline-light btn-sm mb-4 px-3">← Retour Accueil</Link>
        
        <div 
          className="p-5 rounded-3 shadow text-center text-md-start battleplan-header"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.8)), url('/battleplans/GeneralHandbook_files/generalhandbook.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h1 className="text-white fw-bold display-4 mb-0 shadow-text">GENERAL'S HANDBOOK</h1>
          <p className="text-info fs-4 mb-0 text-uppercase fw-light">Battleplans 2025-2026</p>
        </div>
      </div>

      {table1.length > 0 && renderAccordion(table1, "Table1", "First Selection (Table 1)")}
      {table2.length > 0 && renderAccordion(table2, "Table2", "Second Selection (Table 2)")}

      {/* --- MODAL PDF --- */}
      {selectedPdf && (
        <div className="pdf-modal-overlay" onClick={() => setSelectedPdf(null)}>
          <div className="pdf-modal-container" onClick={e => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <span className="fw-bold">LAYOUT AOSFF</span>
              <button className="btn-close btn-close-white" onClick={() => setSelectedPdf(null)}></button>
            </div>
            <div className="pdf-modal-body">
              <iframe 
                src={selectedPdf} 
                width="100%" 
                height="100%" 
                title="Layout PDF"
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shadow-text {
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
        }
        .battleplan-original-html table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 0 !important;
        }
        .battleplan-original-html .abHeader {
          border: none !important;
        }
        .battleplan-original-html p {
          margin-top: 10px;
          line-height: 1.6;
        }
        .accordion-button:not(.collapsed) {
          background-color: #212529 !important;
          color: #ffc107 !important;
        }
        .accordion-button::after { filter: invert(1); }
        .battleplan-original-html { color: #ccc; }
        .accordion-item:first-of-type>.accordion-header .accordion-button {
          border:0 !important;
        }
        /* Style de la Modal PDF */
        .pdf-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .pdf-modal-container {
            width: 100%;
            max-width: 1000px;
            height: 90vh;
            background: #222;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .pdf-modal-header {
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #111;
            border-bottom: 1px solid #333;
        }
        .pdf-modal-body {
            flex-grow: 1;
        }
      `}</style>
    </div>
  );
}