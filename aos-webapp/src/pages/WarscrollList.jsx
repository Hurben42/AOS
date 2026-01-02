import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";
import Breadcrumb from "../components/Breadcrumb";

const FACTION_SECTIONS = [
  "BATTLE TRAITS", "BATTLE FORMATIONS", "HEROIC TRAITS",
  "ARTEFACTS OF POWER", "SPELL LORE", "PRAYER LORE",
];

const KEYWORD_ORDER = [
  "HERO", "INFANTRY", "CAVALRY", "BEAST", "MONSTER", "WAR MACHINE", "MANIFESTATION",
];

export default function WarscrollList() {
  const { category, faction } = useParams();
  const [factionInfos, setFactionInfos] = useState({});
  const [realFactionKey, setRealFactionKey] = useState("");

  const availableBanners = [
    "citiesofsigmar", "daughtersofkhaine", "flesheater", "fyreslayers",
    "gloomspite", "helsmiths", "idoneth", "ironjawz", "kharadron",
    "khorne", "kruleboyz", "lumineth", "nighthaunt", "nurgle",
    "ogor", "ossiarch", "seraphon", "skaven", "slaanesh",
    "slaves", "sonsofbehemat", "soulblight", "stormcast",
    "sylvaneth", "tzeentch"
  ];

  useEffect(() => {
    const catKey = category ? category.toLowerCase() : "";
    const allianceData = warscrollsData[catKey] || {};
    const cleanParam = faction.toLowerCase().replace(/[\s-]/g, "");
    
    const foundKey = Object.keys(allianceData).find(
      (key) => key.toLowerCase().replace(/[\s-]/g, "") === cleanParam
    );

    if (foundKey) {
      setRealFactionKey(foundKey);
      const rawUnits = allianceData[foundKey] || [];
      const groups = {};

      rawUnits.forEach((ws) => {
        const container = document.createElement("div");
        container.innerHTML = ws.html;
        const kwLine = container.querySelector(".wsKeywordLine1")?.textContent.toUpperCase() || "";
        const primary = KEYWORD_ORDER.find(k => kwLine.includes(k));
        
        // On n'ajoute QUE si un mot-clé de KEYWORD_ORDER est trouvé
        if (primary) {
          if (!groups[primary]) groups[primary] = [];
          groups[primary].push(ws);
        }
      });

      const sorted = {};
      KEYWORD_ORDER.forEach(k => { if (groups[k]) sorted[k] = groups[k]; });
      setFactionInfos(sorted);
    }
  }, [category, faction]);

  const getBannerName = () => {
    const urlName = faction.toLowerCase().replace(/-/g, "");
    const match = availableBanners.find(b => urlName.includes(b));
    return match || "default";
  };

  const backgroundUrl = `/img/banner_${getBannerName()}.webp`;

  return (
    <div className="position-relative min-vh-100">
      <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.9)), url("${backgroundUrl}")`,
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', zIndex: -1
      }} />

      <div className="container mt-4 pb-5 position-relative">
        <Breadcrumb factionName={faction} displayFaction={realFactionKey} />

        <h2 className="text-uppercase fw-bold text-white mb-4 shadow-text display-5 mt-3">{realFactionKey || faction}</h2>

        <div className="card mb-5 bg-dark bg-opacity-75 border-secondary border-opacity-25 shadow-lg blur-bg">
          <div className="card-header bg-black text-white bg-opacity-50 fw-bold">📜 RÈGLES D'ARMÉE</div>
          <div className="card-body">
            <div className="row g-2">
              {FACTION_SECTIONS.map((section) => (
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

        <div className="accordion" id="warscrollAccordion">
          {Object.entries(factionInfos).map(([keyword, list]) => (
            <div className="accordion-item bg-dark bg-opacity-75 border-secondary border-opacity-25 mb-2 blur-bg" key={keyword}>
              <h2 className="accordion-header">
                <button className="accordion-button collapsed bg-transparent text-white fw-bold" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${keyword}`}>
                  {keyword} <span className="badge bg-info ms-2 opacity-75">{list.length}</span>
                </button>
              </h2>
              <div id={`collapse-${keyword}`} className="accordion-collapse collapse" data-bs-parent="#warscrollAccordion">
                <div className="accordion-body p-0">
                  <ul className="list-group list-group-flush">
                    {list.map((ws) => (
                      <li key={ws.slug} className="list-group-item bg-transparent text-white p-3 border-secondary border-opacity-10 position-relative">
                        <Link to={`/category/${category}/faction/${faction}/warscroll/${ws.slug}`} className="text-white text-decoration-none fw-bold d-block stretched-link">
                          {ws.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`.blur-bg { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); } .shadow-text { text-shadow: 2px 2px 8px rgba(0,0,0,1); } .accordion-button:not(.collapsed) { background-color: rgba(13, 202, 240, 0.2) !important; color: white !important; } .accordion-button::after { filter: invert(1); }`}</style>
    </div>
  );
}