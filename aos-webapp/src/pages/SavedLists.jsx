import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function SavedLists() {
  const [savedLists, setSavedLists] = useState([]);

  const bannerMapping = {
    "Ossiarch Bonereapers": "ossiarch", "Soulblight Gravelords": "soulblight",
    "Nighthaunt": "nighthaunt", "Flesh-eater Courts": "flesheater",
    "Sons of Behemat": "sonsofbehemat", "Idoneth Deepkin": "idoneth",
    "Blades of Khorne": "khorne", "Sylvaneth": "sylvaneth",
    "Disciples of Tzeentch": "tzeentch", "Ironjawz": "ironjawz",
    "Gloomspite Gitz": "gloomspite", "Slaves to Darkness": "slaves",
    "Lumineth Realm-lords": "lumineth", "Hedonites of Slaanesh": "slaanesh",
    "Skaven": "skaven", "Daughters of Khaine": "daughtersofkhaine",
    "Kruleboyz": "kruleboyz", "Kharadron Overlords": "kharadron",
    "Cities of Sigmar": "citiesofsigmar", "Fyreslayers": "fyreslayers",
    "Seraphon": "seraphon", "Stormcast Eternals": "stormcast",
    "Maggotkin of Nurgle": "nurgle", "Ogor Mawtribes": "ogor"
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    setSavedLists(saved);
  }, []);

  const deleteList = (id) => {
    if (window.confirm("Supprimer cette liste définitivement ?")) {
      const updated = savedLists.filter((l) => l.id !== id);
      localStorage.setItem("warhammer_saved_lists", JSON.stringify(updated));
      setSavedLists(updated);
    }
  };

  const formatSlug = (name) => {
    return name.toLowerCase().trim().replace(/'/g, '-').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  };

  const countTotalUnits = (list) => {
    if (!list.regiments) return 0;
    return list.regiments.reduce((total, reg) => total + (reg.units ? reg.units.length : 0), 0);
  };

  // Formatage de la date en JJ/MM
  const formatDateFR = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Si le format stocké n'est pas une date valide (ex: "01/01/2024"), on tente un fallback
      return dateStr.split('/').slice(0, 2).join('/');
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const getFactionColor = (faction) => {
    const alliances = {
      order: ["Stormcast Eternals", "Cities of Sigmar", "Seraphon", "Lumineth Realm-lords", "Sylvaneth", "Kharadron Overlords", "Fyreslayers", "Idoneth Deepkin", "Daughters of Khaine"],
      death: ["Soulblight Gravelords", "Ossiarch Bonereapers", "Nighthaunt", "Flesh-eater Courts"],
      chaos: ["Skaven", "Slaves to Darkness", "Maggotkin of Nurgle", "Blades of Khorne", "Hedonites of Slaanesh", "Disciples of Tzeentch"],
      destruction: ["Ironjawz", "Kruleboyz", "Gloomspite Gitz", "Ogor Mawtribes", "Sons of Behemat"]
    };

    if (alliances.order.includes(faction)) return "bg-info text-dark";
    if (alliances.death.includes(faction)) return "bg-primary text-white";
    if (alliances.chaos.includes(faction)) return "bg-secondary text-white";
    if (alliances.destruction.includes(faction)) return "bg-warning text-dark";
    return "bg-dark text-white";
  };

  return (
    <div className="container mt-4 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-uppercase mb-0 text-white">Mes Armées</h2>
        <Link to="/import" className="btn btn-primary fw-bold shadow-sm px-4 rounded-pill">
          + IMPORTER UNE LISTE
        </Link>
      </div>

      {savedLists.length === 0 ? (
        <div className="text-center p-5 bg-dark rounded-4 border border-secondary border-opacity-25">
          <p className="text-secondary mb-0">Aucune liste sauvegardée pour le moment.</p>
        </div>
      ) : (
        <div className="row g-4">
          {savedLists.map((list) => {
            const bannerKey = bannerMapping[list.faction] || formatSlug(list.faction);
            const bannerPath = `/img/banner_${bannerKey}.webp`;
            const colorClass = getFactionColor(list.faction);

            return (
              <div key={list.id} className="col-12 col-md-6 col-xl-4">
                <div className="card bg-dark border-0 shadow-lg h-100 rounded-4 overflow-hidden position-relative border border-secondary border-opacity-10">
                  
                  {/* Banner Section */}
                  <div className="position-relative" style={{ height: '140px', overflow: 'hidden' }}>
                    <img 
                      src={bannerPath} 
                      alt={list.faction}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover', opacity: '0.6', filter: 'brightness(0.7)' }}
                      onError={(e) => { e.target.src = '/img/banner_default.webp'; }}
                    />
                    <div className="position-absolute top-0 end-0 p-2">
                      <button 
                        onClick={() => deleteList(list.id)} 
                        className="btn btn-sm btn-danger bg-opacity-75 border-0 rounded-circle shadow"
                        style={{ width: '28px', height: '28px', padding: '0', fontSize: '0.8rem' }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="position-absolute bottom-0 start-0 p-3">
                      <span className={`badge ${colorClass} text-uppercase shadow-sm mb-1`} style={{ fontSize: '0.65rem', letterSpacing: '1px', fontWeight: '800' }}>
                        {list.faction}
                      </span>
                      <div className="text-white-50" style={{ fontSize: '0.7rem', fontWeight: '500' }}>
                        Généré le : {formatDateFR(list.dateSaved || list.id)}
                      </div>
                    </div>
                  </div>

                  <div className="card-body p-4 d-flex flex-column">
                    <h4 className="fw-bold text-white mb-3 text-uppercase" style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                      {list.subFaction && list.subFaction !== "Inconnue" ? list.subFaction : "Ost de Guerre"}
                    </h4>
                    
                    <div className="d-flex gap-2 mb-4">
                      <div className="flex-fill bg-black bg-opacity-40 rounded p-2 border border-secondary border-opacity-20 text-center">
                        <small className="text-secondary d-block text-uppercase mb-1" style={{ fontSize: '0.55rem', letterSpacing: '0.5px' }}>Régiments</small>
                        <span className="fw-bold text-info fs-5">{list.regiments?.length || 0}</span>
                      </div>
                      <div className="flex-fill bg-black bg-opacity-40 rounded p-2 border border-secondary border-opacity-20 text-center">
                        <small className="text-secondary d-block text-uppercase mb-1" style={{ fontSize: '0.55rem', letterSpacing: '0.5px' }}>Unités</small>
                        <span className="fw-bold text-success fs-5">{countTotalUnits(list)}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <Link to={`/my-lists/${list.id}`} className="btn btn-outline-light w-100 fw-bold rounded-pill py-2 shadow-sm text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
                        Consulter l'Ost
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}