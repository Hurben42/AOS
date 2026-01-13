import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

export default function SavedLists() {
  const navigate = useNavigate();
  const location = useLocation();
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
    "sons of behemat": "sonsofbehemat", "sylvaneth": "sylvaneth", "disciples of tzeentch": "tzeentch",
    "helsmiths": "helsmiths"
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    setSavedLists(saved);

    const params = new URLSearchParams(location.search);
    const importData = params.get("importData");

    if (importData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(importData)));
        if (decoded && decoded.id) {
          const exists = saved.find(l => l.id === decoded.id);
          if (!exists) {
            const newList = [decoded, ...saved];
            localStorage.setItem("warhammer_saved_lists", JSON.stringify(newList));
            setSavedLists(newList);
            setImportSuccess(decoded);
          }
          navigate("/my-lists", { replace: true });
        }
      } catch (err) { console.error("Erreur import:", err); }
    }
  }, [location, navigate]);

  const deleteList = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Supprimer cet Ost ?")) {
      const updated = savedLists.filter(l => l.id !== id);
      setSavedLists(updated);
      localStorage.setItem("warhammer_saved_lists", JSON.stringify(updated));
    }
  };

  const getShareUrl = (list) => {
    if (!list) return "";
    try {
      const tinyList = {
        id: list.id,
        title: list.title || list.customTitle,
        faction: list.faction,
        points: list.points,
        regiments: list.regiments
      };
      return `${window.location.origin}/my-lists?importData=${btoa(encodeURIComponent(JSON.stringify(tinyList)))}`;
    } catch (e) { return ""; }
  };

  return (
    <div className="container mt-4 pb-5 px-3 font-monospace">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary border-opacity-25 pb-3">
        <div>
          <h3 className="text-white fw-bold mb-0 text-uppercase" style={{letterSpacing: '2px'}}>Mes Listes</h3>
          <small className="text-info text-uppercase fw-bold" style={{fontSize: '0.6rem'}}>Importez et gérez vos listes</small>
        </div>
        <Link to="/import" className="btn btn-outline-info btn-sm px-4 fw-bold text-uppercase" style={{borderRadius: '0'}}>
          + IMPORTER
        </Link>
      </div>

      <div className="row g-3">
        {savedLists.map((list) => {
          const factionKey = list.faction?.toLowerCase() || "default";
          const banner = bannerMapping[factionKey] || "default";

          return (
            <div key={list.id} className="col-12">
              <div 
                className="data-card shadow-lg"
                onClick={() => navigate(`/my-lists/${list.id}`)}
              >
                {/* Volet Points FIXE (65px) */}
                <div className="card-points-sidebar">
                  <div className="points-label">PTS</div>
                  <div className="points-val">{list.points}</div>
                </div>

                {/* Corps de la carte */}
                <div className="card-main">
                  {/* Image toujours en couleur (opacity stable) */}
                  <div 
                    className="card-image-bg" 
                    style={{ backgroundImage: `url(/img/banner_${banner}.webp)` }}
                  ></div>
                  
                  <div className="card-content-overlay">
                    <div className="top-meta">
                      <span className="faction-pill">{list.faction}</span>
                    </div>
                    
                    <h5 className="army-name-display text-truncate shadow-text">
                      {list.title || "Untitled_Army"}
                    </h5>
                    
                    <div className="bottom-meta">
                      <span>REGIMENTS: {list.regiments?.length || 0}</span>
                    </div>
                  </div>

                  <div className="card-actions-dock">
                    <button className="dock-btn" onClick={(e) => { e.stopPropagation(); setShowQR(list); }}>
                      <i className="bi bi-qr-code"></i>
                    </button>
                    <button className="dock-btn del" onClick={(e) => deleteList(e, list.id)}>
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE PARTAGE */}
      {showQR && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000}}>
          <div className="modal-dialog modal-dialog-centered px-4">
            <div className="modal-content bg-black border-info border-opacity-25 rounded-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <button type="button" className="btn-close btn-close-white ms-auto" onClick={() => setShowQR(null)}></button>
              </div>
              <div className="modal-body text-center p-4">
                <h5 className="text-white fw-bold mb-4 text-uppercase border-bottom border-secondary pb-2">QR CODE</h5>
                <div className="bg-white p-2 d-inline-block rounded-1 mb-3">
                  <QRCodeSVG value={getShareUrl(showQR)} size={200} level="L" />
                </div>
                <div className="text-info fw-bold text-truncate px-3 mb-1">{showQR.title}</div>
                <button className="btn btn-info w-100 mt-4 rounded-0 fw-bold" onClick={() => {
                  navigator.clipboard.writeText(getShareUrl(showQR));
                  alert("Link Copied");
                }}>COPY_STRING</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE SUCCÈS */}
      {importSuccess && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 11000}}>
          <div className="modal-dialog modal-dialog-centered px-3">
            <div className="card bg-black border-info rounded-0 w-100 shadow-pulse-blue">
              <div className="card-body text-center p-5">
                <i className="bi bi-cpu text-info mb-4" style={{fontSize: '4rem'}}></i>
                <h3 className="text-white fw-bold text-uppercase mb-2">New Data Imported</h3>
                <p className="text-white-50 mb-4 font-monospace">SOURCE: {importSuccess.title}</p>
                <button className="btn btn-info w-100 py-3 rounded-0 fw-bold text-uppercase" onClick={() => setImportSuccess(null)}>
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .data-card {
          display: flex;
          height: 95px;
          background: #050505;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          cursor: pointer;
        }
          .data-card:hover {
          border-color: #0dcaf0;
          background: #000;
          }

        /* Largeur FIXE pour éviter les sauts de mise en page */
        .card-points-sidebar {
          width: 65px;
          min-width: 65px;
          background: #0dcaf0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #000;
          font-weight: 900;
          border-right: 1px solid rgba(0,0,0,0.2);
        }

        .points-label { font-size: 0.5rem; line-height: 1; opacity: 0.8; }
        .points-val { font-size: 0.9rem; line-height: 1.1; }

        .card-main {
          flex-grow: 1;
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 12px;
          overflow: hidden;
        }

        .card-image-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.4; /* Opacité stable */
          filter: none; /* Pas de grayscale */
        }

        .card-content-overlay {
          position: relative;
          z-index: 2;
          flex-grow: 1;
          overflow: hidden;
          padding-right: 5px;
        }

        .faction-pill {
          font-size: 0.5rem;
          background: rgba(0, 0, 0, 0.6);
          color: #ffc107;
          padding: 1px 6px;
          border: 1px solid #ffc107;
          text-transform: uppercase;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .army-name-display {
          color: #fff;
          margin: 3px 0;
          font-weight: 800;
          font-size: 0.95rem;
          letter-spacing: 0.5px;
        }

        .bottom-meta {
          font-size: 0.55rem;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.5px;
          font-weight: bold;
        }

        .card-actions-dock {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 6px;
        }

        .dock-btn {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .dock-btn:hover { border-color: #0dcaf0; color: #0dcaf0; }
        .dock-btn.del:hover { border-color: #ff4757; color: #ff4757; }

        .shadow-text { text-shadow: 2px 2px 4px #000; }
        .shadow-pulse-blue { box-shadow: 0 0 20px rgba(13, 202, 240, 0.3); }
      `}</style>
    </div>
  );
}