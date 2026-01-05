import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";

// Mapping pour faire correspondre le nom de la faction au nom du fichier image sur le disque
const factionImageMap = {
  "Helsmiths": "helsmiths",
  "Ossiarch Bonereapers": "ossiarch",
  "Soulblight Gravelords": "soulblight",
  "Nighthaunt": "nighthaunt",
  "Flesh-eater Courts": "flesheater",
  "Sons of Behemat": "sonsofbehemat",
  "Idoneth Deepkin": "idonethdeepkin",
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
  "Maggotkin of Nurgle": "nurgle",
  "Ogor Mawtribes": "ogor"
};

export default function Category() {
  const { category } = useParams();
  const navigate = useNavigate();
  const categoryKey = category.toLowerCase();
  
  // Récupération des noms des factions pour cette allégeance
  const factions = Object.keys(warscrollsData[categoryKey] || {});

  // Fonction pour nettoyer l'URL (conserver la logique de ton app)
  const cleanForUrl = (name) => name.toLowerCase().replace(/\s+/g, "").trim();

  return (
    <div className="container mt-4 pb-5 px-3">
      {/* Bouton Retour à la place du Breadcrumb */}
      <button 
        onClick={() => navigate("/")} 
        className="btn btn-outline-light btn-sm mb-3 d-flex align-items-center border-secondary-subtle"
        style={{ fontSize: '0.8rem', letterSpacing: '1px' }}
      >
        <span className="me-2">←</span> RETOUR
      </button>
      
      <h2 className="mb-4 text-white text-uppercase fw-bold" style={{ letterSpacing: '2px' }}>
        Allégeance : {category}
      </h2>

      {/* Grille : 1 col sur mobile, 2 sur tablette, 3 sur desktop */}
      <div className="row g-4">
        {factions.map((faction) => {
          // On récupère le nom du fichier image via le mapping ou on nettoie par défaut
          const imageName = factionImageMap[faction] || cleanForUrl(faction);
          const imagePath = `/factions/images/${imageName}.png`;

          return (
            <div key={faction} className="col-6 col-lg-4">
              <Link
                to={`/category/${categoryKey}/faction/${cleanForUrl(faction)}`}
                className="card border shadow-lg rounded-4 overflow-hidden position-relative faction-card"
                style={{ height: '150px', transition: 'all 0.3s ease', textDecoration: 'none' }}
              >
                {/* Background Image avec Overlay */}
                <div 
                  className="position-absolute w-100 h-100 faction-bg" 
                  style={{ 
                    backgroundImage: `url(${imagePath}), url('/img/banner_default.webp')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top center',
                    filter: 'brightness(0.6)',
                    zIndex: 0
                  }}
                />
                
                {/* Contenu Texte */}
                <div className="card-img-overlay d-flex align-items-center justify-content-center text-center" style={{ zIndex: 1 }}>
                  <h5 className="text-white fw-bold text-uppercase m-0 shadow-text" style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>
                    {faction}
                  </h5>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <style>{`
        .faction-card {
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .faction-card:hover {
          border-color: #ffc107 !important;
        }
        .faction-card:hover .faction-bg {
          filter: brightness(0.8) !important;
          transform: scale(1.05);
        }
        .faction-bg {
          transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.3s ease;
        }
        .shadow-text {
          text-shadow: 2px 2px 12px rgba(0,0,0,1);
        }
      `}</style>
    </div>
  );
}