import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";
import terrainIndex from "../data/factionTerrainIndex.json";
import manifestationsIndex from "../data/manifestationsIndex.json";

// 1. Configuration des icônes
const ROLE_ICONS = {
  'HERO': '💀',
  'INFANTRY': '🛡️',
  'CAVALRY': '🏇',
  'BEAST': '🐾',
  'MONSTER': '🐲',
  'WAR MACHINE': '⚙️',
  'ARTILLERY': '💣',
  'MANIFESTATION': '✨',
  'TERRAIN': '📍'
};

export default function FactionList() {
  const { category, faction } = useParams();
  const navigate = useNavigate();

  // --- FORCE LA TRANSPARENCE DU PARENT ---
  useEffect(() => {
    const parentDiv = document.querySelector('.bg-black.text-light.min-vh-100');
    if (parentDiv) {
      parentDiv.style.backgroundColor = 'transparent';
      parentDiv.classList.remove('bg-black');
    }
    return () => {
      if (parentDiv) {
        parentDiv.style.backgroundColor = '';
        parentDiv.classList.add('bg-black');
      }
    };
  }, []);

  const normalize = (str) => 
    str?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim() || "";

  // 2. Extraction des données
  const catKey = Object.keys(warscrollsData).find(k => k.toLowerCase() === category.toLowerCase()) || category;
  const allianceData = warscrollsData[catKey] || {};
  
  const realFactionKey = Object.keys(allianceData).find(
    (key) => key.toLowerCase().replace(/\s+/g, "") === faction.toLowerCase().replace(/-/g, "")
  );
  
  const allUnits = realFactionKey ? allianceData[realFactionKey] : [];
  const terrainEntry = terrainIndex[faction.toLowerCase()];

  // --- LOGIQUE DU BACKGROUND ---
  const imageFileName = (realFactionKey || faction)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  const backgroundImagePath = `/img/banner_${imageFileName}.webp`;

  const cleanFactionKey = realFactionKey ? normalize(realFactionKey) : normalize(faction);
  const factionCVs = manifestationsIndex.factions[cleanFactionKey] || [];

  // 3. MOTEUR DE TRI (STRICT SUR LES MOTS-CLÉS)
  const groupedUnits = allUnits.reduce((acc, unit) => {
    // Exclure le terrain de faction
    if (terrainEntry && unit.slug === terrainEntry.slug) return acc;

    const rawHtml = unit.html || "";
    // On extrait uniquement le contenu de wsKeywordLine1
    const keywordMatch = rawHtml.match(/<td[^>]*class="[^"]*wsKeywordLine1[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
    
    // Si pas de mots-clés trouvés, on ignore l'unité
    if (!keywordMatch) return acc;

    const keywordsText = keywordMatch[1]
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    let detectedRole = null;

    // --- LOGIQUE DE TRI ---
    // On vérifie MANIFESTATION en priorité et uniquement dans les mots-clés
    if (keywordsText.includes("MANIFESTATION")) {
      detectedRole = "MANIFESTATION";
    } 
    // Sinon on cherche les autres rôles, toujours uniquement dans les mots-clés
    else if (keywordsText.includes("HERO")) detectedRole = "HERO";
    else if (keywordsText.includes("WAR MACHINE") || keywordsText.includes("WAR-MACHINE")) detectedRole = "WAR MACHINE";
    else if (keywordsText.includes("MONSTER")) detectedRole = "MONSTER";
    else if (keywordsText.includes("BEAST")) detectedRole = "BEAST";
    else if (keywordsText.includes("CAVALRY")) detectedRole = "CAVALRY";
    else if (keywordsText.includes("ARTILLERY")) detectedRole = "ARTILLERY";
    else detectedRole = "INFANTRY";

    if (detectedRole) {
      let unitWithCV = { ...unit };
      if (detectedRole === "MANIFESTATION") {
        const cvData = factionCVs.find(m => normalize(m.name) === normalize(unit.name));
        if (cvData) unitWithCV.displayCV = cvData.castingValue;
      }

      if (!acc[detectedRole]) acc[detectedRole] = [];
      acc[detectedRole].push(unitWithCV);
    }

    return acc;
  }, {});

  const roleOrder = ["HERO", "INFANTRY", "CAVALRY", "BEAST", "MONSTER", "WAR MACHINE", "ARTILLERY", "MANIFESTATION"];
  const sortedRoles = Object.keys(groupedUnits).sort((a, b) => {
    let idxA = roleOrder.indexOf(a);
    let idxB = roleOrder.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  return (
    <div className="position-relative min-vh-100">
      <div 
        className="fixed-top w-100 h-100" 
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url("${backgroundImagePath}")`,
          backgroundSize: 'cover', 
          backgroundPosition: 'center top', 
          backgroundAttachment: 'fixed', 
          zIndex: '-1'
        }}
      ></div>

      <div className="container mt-4 pb-5 position-relative" style={{ zIndex: 1 }}>
        <div className="mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-outline-secondary btn-sm bg-dark bg-opacity-50 border-secondary border-opacity-50 text-white"
            style={{ borderRadius: '8px', letterSpacing: '1px' }}
          >
            ← Retour 
          </button>
        </div>
        
        <h2 className="text-uppercase fw-bold text-white mb-4 shadow-text display-5">
          {realFactionKey || faction.replace(/-/g, ' ')}
        </h2>

        <div className="accordion shadow-lg" id="warscrollAccordion">
          {sortedRoles.map((role) => {
            const units = groupedUnits[role];
            const collapseId = `collapse-${role.replace(/\s+/g, '')}`;
            
            return (
              <div className="accordion-item bg-dark bg-opacity-75 border-secondary border-opacity-25 mb-2 blur-bg overflow-hidden shadow-sm" style={{borderRadius: '10px'}} key={role}>
                <h2 className="accordion-header">
                  <button 
                    className="accordion-button collapsed bg-transparent text-white fw-bold py-3 shadow-none" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target={`#${collapseId}`}
                  >
                    <span className="me-3 fs-5">{ROLE_ICONS[role] || '📜'}</span>
                    <span className="text-uppercase" style={{letterSpacing: '1px'}}>{role}</span>
                    <span className="badge bg-info bg-opacity-25 text-info ms-3 px-3">{units.length}</span>
                  </button>
                </h2>
                <div id={collapseId} className="accordion-collapse collapse" data-bs-parent="#warscrollAccordion">
                  <div className="accordion-body p-0 border-top border-secondary border-opacity-25">
                    <div className="list-group list-group-flush">
                      {units.sort((a,b) => a.name.localeCompare(b.name)).map((unit) => (
                        <Link 
                          key={unit.slug}
                          className="list-group-item bg-transparent text-white border-secondary border-opacity-10 d-flex justify-content-between align-items-center p-3 text-decoration-none list-item-hover" 
                          to={`/category/${category}/faction/${faction}/warscroll/${unit.slug}`}
                        >
                          <div className="d-flex align-items-center">
                            <span className="fw-medium">{unit.name}</span>
                            {unit.displayCV && (
                              <span className="ms-2 badge bg-success bg-opacity-25 border border-success rounded-pill px-2" style={{fontSize: '0.65rem'}}>
                                Casting: {unit.displayCV}+
                              </span>
                            )}
                          </div>
                          <i className="bi bi-chevron-right small text-primary opacity-50"></i>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {terrainEntry && (
          <div className="card my-4 bg-dark bg-opacity-75 border-secondary border-opacity-25 shadow-lg blur-bg">
            <div className="card-body align-items-center py-3">
              <div className="row">
                <div className="col-12 col-md-8">
                  <h6 className="text-info fw-bold mb-1 small text-uppercase">📍 Terrain de Faction</h6>
                  <h5 className="text-white mb-0 fw-bold">{terrainEntry.name}</h5>
                </div>
                <div className="col-12 col-md-4">
                  <Link className="btn btn-info fw-bold px-4 shadow-sm mt-2 mt-md-0 w-100" to={`/category/${category}/faction/${faction}/warscroll/${terrainEntry.slug}`}>
                    WARSCROLL
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card mb-4 bg-dark bg-opacity-75 border-secondary border-opacity-25 blur-bg shadow-lg">
          <div className="card-header bg-black bg-opacity-50 text-white-50 small fw-bold" style={{letterSpacing: '1px'}}>ARMY RULES</div>
          <div className="card-body p-3">
            <div className="row g-2">
              {["battle-traits", "battle-formations", "heroic-traits", "monstrous-traits", "artefacts-of-power", "spell-lore", "prayer-lore", "manifestation-lore"].map((id) => (
                <div className="col-12 col-sm-6 col-md-4" key={id}>
                  <Link 
                    className="btn btn-outline-primary w-100 text-start bg-dark bg-opacity-50 btn-sm text-truncate text-light border-secondary border-opacity-25 py-2" 
                    to={`/category/${category}/faction/${faction}/section/${id}`}
                  >
                    {id.replace(/-/g, ' ').toUpperCase()}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .blur-bg { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .shadow-text { text-shadow: 2px 2px 12px rgba(0,0,0,1); }
        .accordion-button:not(.collapsed) { background-color: rgba(13, 202, 240, 0.1) !important; color: #0dcaf0 !important; }
        .accordion-button::after { filter: invert(1); transform: scale(0.8); }
        .list-item-hover:hover { background-color: rgba(255,255,255,0.05) !important; padding-left: 1.5rem !important; transition: all 0.25s ease; }
      `}</style>
    </div>
  );
}