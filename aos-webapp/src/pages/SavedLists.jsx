import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function SavedLists() {
  const [savedLists, setSavedLists] = useState([]);

  const bannerMapping = {
    "soulblight gravelords": "soulblight", "stormcast eternals": "stormcast",
    "slaves to darkness": "slaves", "ossiarch bonereapers": "ossiarch",
    "nighthaunt": "nighthaunt", "flesh-eater courts": "flesheater",
    "cities of sigmar": "citiesofsigmar", "daughters of khaine": "daughtersofkhaine",
    "fyreslayers": "fyreslayers", "gloomspite gitz": "gloomspite",
    "idoneth deepkin": "idoneth", "ironjawz": "ironjawz",
    "kharadron overlords": "kharadron", "blades of khorne": "khorne",
    "kruleboyz": "kruleboyz", "lumineth realm-lords": "lumineth",
    "maggotkin of nurgle": "nurgle", "ogor mawtribes": "ogor",
    "seraphon": "seraphon", "skaven": "skaven", "hedonites of slaanesh": "slaanesh",
    "sons of behemat": "sonsofbehemat", "sylvaneth": "sylvaneth", "disciples of tzeentch": "tzeentch"
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
      setSavedLists(Array.isArray(saved) ? saved.sort((a, b) => b.id - a.id) : []);
    } catch (e) {
      setSavedLists([]);
    }
  }, []);

  const deleteList = (e, id) => {
    e.preventDefault();
    if (window.confirm("Supprimer cet Ost ?")) {
      const updated = savedLists.filter(l => l.id !== id);
      localStorage.setItem("warhammer_saved_lists", JSON.stringify(updated));
      setSavedLists(updated);
    }
  };

  const countTotalUnits = (data) => {
    if (!data?.regiments) return 0;
    return data.regiments.reduce((acc, r) => {
      const heroCount = r?.hero ? 1 : 0;
      const unitsCount = Array.isArray(r?.units) ? r.units.length : 0;
      return acc + heroCount + unitsCount;
    }, 0);
  };

  return (
    <div className="container mt-4 pb-5 px-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-white mb-0 text-uppercase">Mes Ost de Guerre</h2>
        <Link to="/import" className="btn btn-info fw-bold text-white px-4 rounded-pill shadow">+ IMPORTER</Link>
      </div>

      {savedLists.length === 0 ? (
        <div className="text-center py-5"><p className="text-white-50">Aucune liste trouvée.</p></div>
      ) : (
        <div className="row g-4">
          {savedLists.map((list) => {
            if (!list) return null;
            const data = list.listData || list;
            const faction = data?.faction || "Inconnue";
            const banner = bannerMapping[faction.toLowerCase().trim()] || "default";

            return (
              <div key={list.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 bg-dark border-0 shadow-lg rounded-4 overflow-hidden position-relative border border-secondary border-opacity-10">
                  <img src={`/img/banner_${banner}.webp`} className="card-img-top" style={{ height: '140px', objectFit: 'cover', opacity: '0.4' }} onError={(e) => e.target.src="/img/banner_default.webp"} />
                  <button onClick={(e) => deleteList(e, list.id)} className="btn btn-danger btn-sm position-absolute top-0 end-0 m-3" style={{zIndex: 10, borderRadius: '50%'}}>✕</button>
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="mb-4">
                      <small className="text-info fw-bold text-uppercase d-block">{faction}</small>
                      <h5 className="text-white fw-bold text-truncate">{list.title || "Sans nom"}</h5>
                      <h6 className="text-white-50 small">{data?.subFaction || "Générique"}</h6>
                    </div>
                    <div className="d-flex gap-2 mb-4">
                      <div className="flex-fill bg-black bg-opacity-40 rounded p-2 text-center">
                        <small className="text-secondary d-block text-uppercase" style={{fontSize: '0.5rem'}}>Régiments</small>
                        <span className="fw-bold text-info">{data?.regiments?.length || 0}</span>
                      </div>
                      <div className="flex-fill bg-black bg-opacity-40 rounded p-2 text-center">
                        <small className="text-secondary d-block text-uppercase" style={{fontSize: '0.5rem'}}>Unités</small>
                        <span className="fw-bold text-success">{countTotalUnits(data)}</span>
                      </div>
                    </div>
                    <Link to={`/my-lists/${list.id}`} className="btn btn-outline-light w-100 rounded-pill mt-auto">Consulter</Link>
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