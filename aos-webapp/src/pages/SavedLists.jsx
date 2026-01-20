import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

export default function SavedLists() {
  const [savedLists, setSavedLists] = useState([]);
  const [showQR, setShowQR] = useState(null); 

  useEffect(() => {
    const lists = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    setSavedLists(lists);
  }, []);

  const deleteList = (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm("Supprimer cette liste ?")) {
      const updated = savedLists.filter(l => l.id !== id);
      localStorage.setItem("warhammer_saved_lists", JSON.stringify(updated));
      setSavedLists(updated);
    }
  };

  const getBanner = (faction) => {
    const name = faction.toLowerCase().replace(/\s+/g, '');
    return `/img/banner_${name}.webp`;
  };

  return (
    <div className="container mt-4 font-monospace pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-2">
        <h2 className="text-white fw-900 m-0 uppercase" style={{ letterSpacing: '2px' }}>
          Mes Armées <span className="text-info">[{savedLists.length}]</span>
        </h2>
        <Link to="/import" className="btn btn-outline-info btn-sm fw-bold rounded-0">
          + NOUVELLE LISTE
        </Link>
      </div>

      <div className="row g-3">
        {savedLists.map((list) => (
          <div key={list.id} className="col-12 text-start">
            <div className="army-card-wrapper position-relative overflow-hidden shadow-lg border border-secondary border-opacity-25">
              <Link to={`/my-lists/${list.id}`} className="text-decoration-none">
                <div className="army-card-bg" style={{ backgroundImage: `url(${getBanner(list.faction)})` }}></div>
                <div className="army-card-overlay"></div>
                
                <div className="army-card-content p-3 d-flex justify-content-between align-items-end">
                  <div>
                    <div className="faction-tag">{list.faction}</div>
                    <h3 className="army-name-display uppercase">{list.subFaction || "Sans Sous-Faction"}</h3>
                    <div className="bottom-meta">
                      <span className="text-info">{list.points} PTS</span>
                      <span className="mx-2 opacity-25">|</span>
                      <span>{list.regiments?.length || 0} RÉGIMENTS</span>
                    </div>
                  </div>

                  <div className="card-actions-dock">
                    <button className="dock-btn qr" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQR(list); }}>
                      <i className="bi bi-qr-code"></i>
                    </button>
                    <button className="dock-btn del" onClick={(e) => deleteList(list.id, e)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ANCIENNE MODAL RESTAURÉE */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(null)}>
          <div className="modal-content bg-dark border border-info p-4 text-center shadow-lg" onClick={e => e.stopPropagation()} style={{maxWidth: '350px'}}>
            <h5 className="text-info fw-bold mb-3 uppercase small" style={{letterSpacing: '1px'}}>Partager la liste</h5>
            <div className="bg-white p-3 d-inline-block mb-3 shadow">
              <QRCodeSVG value={window.location.origin + "/my-lists/" + showQR.id} size={200} />
            </div>
            <p className="text-secondary tiny uppercase fw-bold mb-3">{showQR.faction}</p>
            <button className="btn btn-outline-light btn-sm w-100 rounded-0 fw-bold" onClick={() => setShowQR(null)}>
              FERMER LE MODULE
            </button>
          </div>
        </div>
      )}

      <style>{`
        .fw-900 { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .tiny { font-size: 0.65rem; }
        
        .army-card-wrapper {
          height: 110px;
          transition: transform 0.2s;
          background: #000;
        }
        .army-card-wrapper:hover {
          border-color: #0dcaf0 !important;
        }

        .army-card-bg {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background-size: cover;
          background-position: center 25%;
          transition: 0.5s ease;
          opacity: 0.6;
        }

        .army-card-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, rgba(0,0,0,0.95) 30%, transparent 100%);
        }

        .army-card-content {
          position: relative;
          z-index: 2;
          height: 100%;
        }

        .faction-tag {
          font-size: 0.55rem;
          background: #ffc107;
          color: #000;
          padding: 1px 6px;
          display: inline-block;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .army-name-display {
          color: #fff;
          font-weight: 800;
          margin: 0;
          font-size: 1.1rem;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .bottom-meta {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.6);
          font-weight: bold;
        }

        .card-actions-dock { display: flex; gap: 8px; }

        .dock-btn {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }
        .dock-btn:hover { background: #fff; color: #000; }
        .dock-btn.del:hover { background: #dc3545; color: #fff; border-color: #dc3545; }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
      `}</style>
    </div>
  );
}