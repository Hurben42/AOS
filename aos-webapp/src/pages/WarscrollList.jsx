import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";
import factionSections from "../data/faction_sections.json";
import manifestationsIndex from "../data/manifestationsIndex.json";

const KEYWORD_ORDER = [
  "HERO", "INFANTRY", "CAVALRY", "BEAST", "MONSTER", "WAR MACHINE", "MANIFESTATION",
];

export default function WarscrollList() {
  const { category, faction } = useParams();
  const navigate = useNavigate();
  const [factionInfos, setFactionInfos] = useState({});
  const [realFactionKey, setRealFactionKey] = useState("");
  const [dynamicSections, setDynamicSections] = useState([]);

  useEffect(() => {
    const catKey = category ? category.toLowerCase() : "";
    const allianceData = warscrollsData[catKey] || {};
    const cleanParam = faction.toLowerCase().replace(/[\s-]/g, "");
    
    const sections = factionSections[cleanParam] || [];
    setDynamicSections(sections.filter(s => s !== "MANIFESTATION LORE"));

    const foundKey = Object.keys(allianceData).find(
      (key) => key.toLowerCase().replace(/[\s-]/g, "") === cleanParam
    );

    if (foundKey) {
      setRealFactionKey(foundKey);
      const rawUnits = allianceData[foundKey] || [];
      
      // Récupération des données de manifestations de l'index
      const factionManifestationData = manifestationsIndex.factions[cleanParam] || [];

      const groups = {};
      rawUnits.forEach((ws) => {
        const container = document.createElement("div");
        container.innerHTML = ws.html;
        const kwLine = container.querySelector(".wsKeywordLine1")?.textContent.toUpperCase() || "";
        
        let primary = null;
        if (kwLine.includes("MANIFESTATION")) {
          primary = "MANIFESTATION";
          
          // Match avec l'index pour la Casting Value
          const foundMatch = factionManifestationData.find(
            m => m.name.toUpperCase() === ws.name.toUpperCase()
          );
          if (foundMatch) {
            ws.displayCV = foundMatch.castingValue;
          }
        } else {
          primary = KEYWORD_ORDER.find(k => kwLine.includes(k));
        }
        
        if (primary) {
          if (!groups[primary]) groups[primary] = [];
          groups[primary].push(ws);
        }
      });

      const sorted = {};
      KEYWORD_ORDER.forEach(k => { 
        if (groups[k]) {
          sorted[k] = groups[k].sort((a, b) => a.name.localeCompare(b.name));
        } 
      });
      setFactionInfos(sorted);
    }
  }, [category, faction]);

  const getBannerName = () => {
    const urlName = faction.toLowerCase().replace(/-/g, "");
    return urlName;
  };

  return (
    <div className="position-relative min-vh-100">
      <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.9)), url("/img/banner_${getBannerName()}.webp")`,
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', zIndex: -1
      }} />

      <div className="container mt-4 pb-5 position-relative">
        <button onClick={() => navigate(-1)} className="btn btn-outline-light btn-sm mb-3 opacity-75">← Retour</button>

        <h2 className="text-uppercase fw-bold text-white mb-4 shadow-text display-5">{realFactionKey || faction}</h2>

        {/* BLOC RÈGLES D'ARMÉE RESTAURÉ */}
        {dynamicSections.length > 0 && (
          <div className="card mb-5 bg-dark bg-opacity-75 border-secondary border-opacity-25 shadow-lg blur-bg">
            <div className="card-header bg-black text-white bg-opacity-50 fw-bold">📜 RÈGLES D'ARMÉE</div>
            <div className="card-body">
              <div className="row g-2">
                {dynamicSections.map((section) => (
                  <div key={section} className="col-md-4 col-12">
                    <Link to={`/category/${category}/faction/${faction}/section/${section.toLowerCase().replace(/\s+/g, "-")}`}
                      className="btn btn-outline-primary w-100 text-light text-start d-flex justify-content-between align-items-center bg-dark bg-opacity-50">
                      <span className="fw-bold" style={{ fontSize: "0.75rem" }}>{section}</span>
                      <i className="bi bi-chevron-right small"></i>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="accordion" id="warscrollAccordion">
          {Object.entries(factionInfos).map(([keyword, list]) => {
            const safeId = keyword.replace(/\s+/g, "-");
            return (
              <div className="accordion-item bg-dark bg-opacity-75 border-secondary border-opacity-25 mb-2 blur-bg" key={keyword}>
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed bg-transparent text-white fw-bold text-uppercase" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${safeId}`}>
                    {keyword} <span className="badge bg-info ms-2 opacity-75">{list.length}</span>
                  </button>
                </h2>
                <div id={`collapse-${safeId}`} className="accordion-collapse collapse" data-bs-parent="#warscrollAccordion">
                  <div className="accordion-body p-0">
                    <ul className="list-group list-group-flush">
                      {list.map((ws) => (
                        <li key={ws.slug} className="list-group-item bg-transparent text-white p-3 border-secondary border-opacity-10 position-relative">
                          <Link to={`/category/${category}/faction/${faction}/warscroll/${ws.slug}`} className="text-white text-decoration-none fw-bold d-flex align-items-center stretched-link">
                            <span>{ws.name}</span>
                            {/* BADGE CV */}
                            {keyword === "MANIFESTATION" && ws.displayCV && (
                              <span className="ms-2 badge bg-success rounded-pill bg-opacity-50 px-2 border border-light border-opacity-25">
                                Casting value: {ws.displayCV}+
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .blur-bg { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); } 
        .shadow-text { text-shadow: 2px 2px 8px rgba(0,0,0,1); } 
        .accordion-button:not(.collapsed) { background-color: rgba(13, 202, 240, 0.2) !important; color: white !important; } 
        .accordion-button::after { filter: invert(1); }
      `}</style>
    </div>
  );
}