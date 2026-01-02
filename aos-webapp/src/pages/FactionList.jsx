import React from "react";
import { useParams, Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";
import Breadcrumb from "../components/Breadcrumb"; // Import manquant

export default function FactionList() {
  const { category, faction } = useParams();

  // 1. RÉCUPÉRATION DE L'ALLIANCE
  const catKey = Object.keys(warscrollsData).find(
    k => k.toLowerCase() === category.toLowerCase()
  ) || category;

  const allianceData = warscrollsData[catKey] || {};

  // 2. RÉCUPÉRATION DE LA CLÉ RÉELLE (ex: "Daughters of Khaine")
  const realFactionKey = Object.keys(allianceData).find(
    (key) => key.toLowerCase().replace(/\s+/g, "") === faction.toLowerCase()
  );

  const units = realFactionKey ? allianceData[realFactionKey] : [];

  // Mapping des bannières pour le background (comme dans tes autres fichiers)
  const bannerMapping = {
    "Helsmiths": "helsmiths",
    "Ossiarch Bonereapers": "ossiarch", 
    "Soulblight Gravelords": "soulblight",
    "Nighthaunt": "nighthaunt", 
    "Flesh-eater Courts": "flesheater",
    "Sons of Behemat": "sonsofbehemat", 
    "Idoneth Deepkin": "idoneth",
    "Blades of Khorne": "khorne", 
    "Sylvaneth": "sylvaneth",
    "Disciples of Tzeentch": "tzeentch", 
    "Ironjawz": "ironjawz",
    "Gloomspite Gitz": "gloomspite", 
    "Slaves to Darkness": "slaves",
    "Lumineth Realm-lords": "lumineth", 
    "Hedonites of Slaanesh": "slaanesh",
    "Skaven": "skaven", 
    "Daughters of Khaine": "daughtersofkhaine",
    "Kruleboyz": "kruleboyz", 
    "Kharadron Overlords": "kharadron",
    "Cities of Sigmar": "citiesofsigmar", 
    "Fyreslayers": "fyreslayers",
    "Seraphon": "seraphon", 
    "Stormcast Eternals": "stormcast",
    "Ogor Mawtribes": "ogor"
  };

  const bannerKey = bannerMapping[realFactionKey] || "default";

  return (
    <div className="position-relative min-vh-100">
      {/* BACKGROUND IMMERSIF */}
      <div 
        className="fixed-top w-100 h-100" 
        style={{
          backgroundImage: `url('/img/banner_${bannerKey}.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3)',
          zIndex: '-1'
        }}
      ></div>

      <div className="container mt-4 pb-5">
        <Breadcrumb categoryName={category} factionName={realFactionKey || faction} />
        
        <h2 className="text-white text-uppercase fw-bold mt-3 shadow-text">
            {realFactionKey || faction}
        </h2>
        
        <div className="accordion mt-4 shadow" id="warscrollAccordion">
          {units.length > 0 ? (
            units.map((unit, index) => (
              <div className="accordion-item bg-dark border-secondary border-opacity-25" key={index}>
                <h2 className="accordion-header">
                  <button 
                    className="accordion-button collapsed bg-dark text-white fw-bold" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target={`#collapse${index}`}
                  >
                    {unit.name}
                  </button>
                </h2>
                <div id={`collapse${index}`} className="accordion-collapse collapse" data-bs-parent="#warscrollAccordion">
                  <div className="accordion-body bg-black bg-opacity-50 text-center">
                    <Link 
                      to={`/category/${category}/faction/${faction}/warscroll/${unit.slug}`}
                      className="btn btn-primary btn-sm px-4 fw-bold shadow-sm"
                    >
                      OUVRIR LE WARSCROLL 🔍
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="alert alert-danger bg-dark text-white border-danger">
              Aucun warscroll trouvé pour "{faction}".
            </div>
          )}
        </div>
      </div>

      <style>{`
        .shadow-text { text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
        .accordion-button:not(.collapsed) {
            background-color: rgba(255, 255, 255, 0.1) !important;
            color: #0dcaf0 !important;
        }
      `}</style>
    </div>
  );
}