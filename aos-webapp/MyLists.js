import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function MyLists() {
  const [lists, setLists] = useState([]);

  const bannerMapping = {
    "Helsmiths": "helsmiths", "Ossiarch Bonereapers": "ossiarch", "Soulblight Gravelords": "soulblight",
    "Nighthaunt": "nighthaunt", "Flesh-eater Courts": "flesheater", "Sons of Behemat": "sonsofbehemat",
    "Idoneth Deepkin": "idoneth", "Blades of Khorne": "khorne", "Sylvaneth": "sylvaneth",
    "Disciples of Tzeentch": "tzeentch", "Ironjawz": "ironjawz", "Gloomspite Gitz": "gloomspite",
    "Slaves to Darkness": "slaves", "Lumineth Realm-lords": "lumineth", "Hedonites of Slaanesh": "slaanesh",
    "Skaven": "skaven", "Daughters of Khaine": "daughtersofkhaine", "Kruleboyz": "kruleboyz",
    "Kharadron Overlords": "kharadron", "Cities of Sigmar": "citiesofsigmar", "Fyreslayers": "fyreslayers",
    "Seraphon": "seraphon", "Stormcast Eternals": "stormcast", "Maggotkin of Nurgle": "nurgle", "Ogor Mawtribes": "ogor"
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    
    // --- LE TRI SE FAIT ICI ---
    // On trie par ID décroissant : les IDs les plus élevés (plus récents) en premier.
    const sorted = [...saved].sort((a, b) => {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idB - idA; 
    });

    setLists(sorted);
  }, []);

  const deleteList = (id) => {
    if (window.confirm("Supprimer cette liste définitivement ?")) {
      const updated = lists.filter(l => l.id !== id);
      localStorage.setItem("warhammer_saved_lists", JSON.stringify(updated));
      setLists(updated);
    }
  };

  return (
    <div className="container mt-4 pb-5 font-monospace">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <h3 className="text-white fw-bold m-0 text-uppercase">Mes Armées</h3>
        <Link to="/import" className="btn btn-sm btn-warning fw-bold text-dark">
          + IMPORTER
        </Link>
      </div>

      <div className="row g-3 px-2">
        {lists.length > 0 ? (
          lists.map((list) => {
            const data = list.listData || list;
            const factionKey = bannerMapping[data.faction] || "default";
            
            return (
              <div key={list.id} className="col-12 col-md-6 col-lg-4">
                <div className="card bg-dark border-0 rounded-4 overflow-hidden shadow-lg position-relative shadow-hover">
                  <img 
                    src={`/img/banner_${factionKey}.webp`} 
                    className="card-img" 
                    alt="" 
                    style={{ height: '120px', objectFit: 'cover', opacity: '0.4' }}
                    onError={(e) => e.target.src = "/img/banner_default.webp"}
                  />
                  <div className="card-img-overlay d-flex flex-column justify-content-between p-3">
                    <div>
                      <h5 className="text-white fw-bold mb-0 text-truncate text-uppercase">
                        {list.title || data.title || "Ost sans nom"}
                      </h5>
                      <small className="text-info text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>
                        {data.faction}
                      </small>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <Link to={`/my-lists/${list.id}`} className="btn btn-sm btn-outline-light flex-grow-1 fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>
                        Ouvrir
                      </Link>
                      <button 
                        onClick={() => deleteList(list.id)}
                        className="btn btn-sm btn-outline-danger border-0"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-5">
            <p className="text-white-50">Aucune armée importée pour le moment.</p>
            <Link to="/import" className="btn btn-outline-info">Importer ma première liste</Link>
          </div>
        )}
      </div>

      <style>{`
        .shadow-hover { transition: transform 0.2s; }
        .shadow-hover:hover { transform: translateY(-3px); }
      `}</style>
    </div>
  );
}