import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

export default function SavedLists() {
  const navigate = useNavigate();
  const [savedLists, setSavedLists] = useState([]);
  const [showQR, setShowQR] = useState(null); 
  const [importSuccess, setImportSuccess] = useState(null); 

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
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get("share");

    if (sharedData) {
      try {
        const decodedList = JSON.parse(decodeURIComponent(sharedData));
        console.log("Données importées :", decodedList); // Debug pour voir les tactiques

        const currentSaved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
        
        // FIX : On s'assure que les tactiques sont bien présentes au premier niveau
        const newListEntry = { 
          ...decodedList, 
          id: Date.now(),
          battle_tactics: decodedList.battle_tactics || decodedList.listData?.battle_tactics || []
        };
        
        const updatedSaved = [newListEntry, ...currentSaved];
        localStorage.setItem("warhammer_saved_lists", JSON.stringify(updatedSaved));
        
        setImportSuccess(newListEntry);
        setSavedLists(updatedSaved);
        
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Erreur importation QR :", e);
      }
    } else {
      loadLists();
    }
  }, []);

  const loadLists = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
      setSavedLists(Array.isArray(saved) ? saved.sort((a, b) => b.id - a.id) : []);
    } catch (e) {
      setSavedLists([]);
    }
  };

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

  const getShareUrl = (list) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const data = encodeURIComponent(JSON.stringify(list));
    return `${baseUrl}?share=${data}`;
  };

  return (
    <div className="container mt-4 pb-5 px-3">
      
      <style>{`
        .modal-overlay-custom {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(15px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }
        .import-card {
          background: #1a1a1a;
          border-radius: 30px;
          overflow: hidden;
          width: 100%;
          max-width: 500px;
          border: 1px solid rgba(13, 202, 240, 0.2);
          box-shadow: 0 0 50px rgba(0,0,0,0.8);
        }
        .banner-header {
          height: 200px;
          position: relative;
        }
        .banner-header img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.6;
        }
        .banner-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 20px;
          background: linear-gradient(transparent, #1a1a1a);
          text-align: center;
        }
        .btn-war-pulse {
          background-color: #0dcaf0;
          color: black;
          border: none;
          padding: 18px;
          border-radius: 50px;
          font-weight: 900;
          letter-spacing: 2px;
          transition: 0.3s;
          box-shadow: 0 0 20px rgba(13, 202, 240, 0.4);
        }
        .btn-war-pulse:hover {
          transform: scale(1.02);
          box-shadow: 0 0 30px rgba(13, 202, 240, 0.6);
        }
      `}</style>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-white mb-0 text-uppercase tracking-wider">Mes listes</h2>
        <Link to="/import" className="btn btn-info fw-bold text-white px-4 rounded-pill shadow-sm">+ IMPORTER</Link>
      </div>

      {savedLists.length === 0 ? (
        <div className="text-center py-5 rounded-4 bg-dark bg-opacity-25 border border-secondary border-opacity-10 text-white-50">
            Aucun Ost enregistré.
        </div>
      ) : (
        <div className="row g-4">
          {savedLists.map((list) => {
            const data = list.listData || list;
            const factionName = data?.faction || "Inconnue";
            const banner = bannerMapping[factionName.toLowerCase().trim()] || "default";

            return (
              <div key={list.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 bg-dark border-0 shadow-lg rounded-4 overflow-hidden position-relative border border-secondary border-opacity-10">
                  <img src={`/img/banner_${banner}.webp`} className="card-img-top" style={{ height: '140px', objectFit: 'cover', opacity: '0.4' }} onError={(e) => e.target.src="/img/banner_default.webp"} />
                  <button onClick={(e) => deleteList(e, list.id)} className="btn btn-danger btn-sm position-absolute top-0 end-0 m-3 rounded-circle opacity-75" style={{zIndex: 10, width: '30px', height: '30px'}}>
                    <i className="bi bi-x"></i>
                  </button>
                  <div className="card-body p-4 d-flex flex-column">
                    <small className="text-info fw-bold text-uppercase d-block mb-1" style={{fontSize: '0.7rem'}}>{factionName}</small>
                    <h5 className="text-white fw-bold text-truncate mb-3">{list.title || "Sans nom"}</h5>
                    <Link to={`/my-lists/${list.id}`} className="btn btn-outline-light w-100 rounded-pill mt-auto fw-bold py-2">Consulter</Link>
                  </div>
                  <button onClick={() => setShowQR(list)} className="btn btn-dark btn-sm position-absolute top-0 start-0 m-3 border border-secondary" style={{zIndex: 10, borderRadius: '10px'}}><i className="bi bi-qr-code-scan text-info"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE SUCCÈS IMPORTATION */}
      {importSuccess && (
        <div className="modal-overlay-custom animate__animated animate__fadeIn">
          <div className="import-card animate__animated animate__zoomIn">
            <div className="banner-header">
              <img 
                src={`/img/banner_${bannerMapping[(importSuccess.listData?.faction || importSuccess.faction || "").toLowerCase().trim()] || "default"}.webp`} 
                onError={(e) => e.target.src="/img/banner_default.webp"}
                alt="Banner"
              />
              <div className="banner-overlay">
                <span className="badge bg-info text-dark rounded-pill mb-2 px-3 fw-bold">RENFORT DÉPLOYÉ</span>
                <h2 className="text-white fw-bold text-uppercase mb-0" style={{letterSpacing: '2px'}}>{importSuccess.title}</h2>
              </div>
            </div>

            <div className="p-4 text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-info bg-opacity-10 rounded-circle mb-4" style={{ width: '80px', height: '80px', border: '2px dashed #0dcaf0' }}>
                <i className="bi bi-shield-fill-check text-info fs-1"></i>
              </div>
              <p className="text-light-50 px-2 mb-4 fs-5 fw-light">
                L'Ost de guerre a rallié votre cause. Les troupes sont prêtes au combat.
              </p>
              <div className="bg-black bg-opacity-30 rounded-4 p-3 mb-4 border border-secondary border-opacity-20">
                <div className="row">
                  <div className="col-6 border-end border-secondary border-opacity-20 text-center">
                    <small className="text-secondary text-uppercase d-block" style={{fontSize: '0.6rem'}}>Faction</small>
                    <span className="text-info fw-bold">{importSuccess.listData?.faction || importSuccess.faction}</span>
                  </div>
                  <div className="col-6 text-center">
                    <small className="text-secondary text-uppercase d-block" style={{fontSize: '0.6rem'}}>Unités</small>
                    <span className="text-info fw-bold">{countTotalUnits(importSuccess.listData || importSuccess)}</span>
                  </div>
                </div>
              </div>
              <button className="btn-war-pulse w-100 text-uppercase" onClick={() => navigate(`/my-lists/${importSuccess.id}`)}>AUX ARMES !</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE QR CODE */}
      {showQR && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary shadow-lg">
              <div className="modal-header border-0 pb-0">
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowQR(null)}></button>
              </div>
              <div className="modal-body text-center p-4">
                <h4 className="text-white fw-bold mb-4 text-uppercase">Partager l'Ost</h4>
                <div className="bg-white p-3 d-inline-block rounded-4 mb-3">
                  <QRCodeSVG value={getShareUrl(showQR)} size={220} level="M" />
                </div>
                <div className="text-info fw-bold">{showQR.title}</div>
                <p className="text-white-50 small mt-2">Scannez ce code pour importer la liste</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}