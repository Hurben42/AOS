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
    const name = faction?.toLowerCase().replace(/\s+/g, '') || "default";
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
          <div key={list.id} className="col-12 col-lg-6 text-start">
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

      {/* MODAL STYLE "RENFORT DÉPLOYÉ" */}
      {showQR && (
        <div className="modal-overlay d-flex align-items-center justify-content-center p-3" onClick={() => setShowQR(null)}>
          <div className="modal-content bg-dark text-center shadow-2xl border-0 overflow-hidden animate__animated animate__zoomIn" 
               onClick={e => e.stopPropagation()} 
               style={{ maxWidth: '400px', borderRadius: '30px', backgroundColor: '#121417' }}>
            
            {/* Header avec Image */}
            <div className="position-relative" style={{ height: '160px' }}>
                <div className="w-100 h-100" style={{ backgroundImage: `url(${getBanner(showQR.faction)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to bottom, transparent, #121417)' }}></div>
                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2">
                    <span className="badge bg-info text-black fw-900 uppercase py-1 px-3 mb-2" style={{ fontSize: '0.65rem', borderRadius: '50px' }}>RENFORT DÉPLOYÉ</span>
                    <h4 className="text-white fw-900 uppercase m-0">SHARE LIST</h4>
                </div>
            </div>

            <div className="p-4 pt-2">
              {/* QR Code Icon Style */}
              <div className="qr-container-outer mb-4">
                <div className="qr-container-inner bg-white p-3 d-inline-block rounded-4 shadow-lg">
                    <QRCodeSVG value={window.location.origin + "/my-lists/" + showQR.id + "?imported=true"} size={160} />
                </div>
              </div>

              <p className="text-white-50 small mb-4 px-3">L'Ost de guerre a rallié votre cause.<br/>Le code est prêt pour la transmission.</p>

              {/* Data Box */}
              <div className="d-flex bg-black bg-opacity-50 rounded-4 border border-secondary border-opacity-10 p-3 mb-4 mx-2">
                  <div className="flex-grow-1 border-end border-secondary border-opacity-25">
                      <div className="tiny text-secondary uppercase fw-bold">Faction</div>
                      <div className="text-info fw-900 small uppercase">{showQR.faction}</div>
                  </div>
                  <div className="flex-grow-1">
                      <div className="tiny text-secondary uppercase fw-bold">Drops</div>
                      <div className="text-info fw-900 small uppercase">{showQR.regiments?.length || 0}</div>
                  </div>
              </div>

              {/* Action Button */}
              <button className="btn btn-info w-100 py-3 rounded-pill fw-900 text-uppercase shadow-info mb-2" onClick={() => setShowQR(null)}>
               OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fw-900 { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .tiny { font-size: 0.6rem; }
        
        .army-card-wrapper { height: 110px; transition: transform 0.2s; background: #000; }
        .army-card-wrapper:hover {border-color: #0dcaf0 !important; }

        .army-card-bg { position: absolute; top:0; left:0; width:100%; height:100%; background-size: cover; background-position: center 25%; opacity: 0.6; }
        .army-card-overlay { position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(90deg, rgba(0,0,0,0.95) 30%, transparent 100%); }
        .army-card-content { position: relative; z-index: 2; height: 100%; }

        .faction-tag { font-size: 0.55rem; background: #ffc107; color: #000; padding: 1px 6px; display: inline-block; font-weight: 900; text-transform: uppercase; }
        .army-name-display { color: #fff; font-weight: 800; margin: 0; font-size: 1.1rem; }
        .bottom-meta { font-size: 0.65rem; color: rgba(255,255,255,0.6); font-weight: bold; }

        .card-actions-dock { display: flex; gap: 8px; }
        .dock-btn { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .dock-btn:hover { background: #fff; color: #000; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); z-index: 1000; }
        .shadow-info { box-shadow: 0 4px 20px rgba(13, 202, 240, 0.4); }
        .qr-container-outer { position: relative; }
        .qr-container-outer::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 220px; height: 220px; border: 2px dashed rgba(13, 202, 240, 0.3); border-radius: 50%; z-index: -1; }
      `}</style>
    </div>
  );
}