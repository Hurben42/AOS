import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

export default function SavedLists() {
  const [savedLists, setSavedLists] = useState([]);
  const [showQR, setShowQR] = useState(null); 
  const [successMsg, setSuccessMsg] = useState(false);

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

  // --- LOGIQUE D'IMPORTATION VIA URL (SCAN) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get("share");

    if (sharedData) {
      try {
        const decodedList = JSON.parse(decodeURIComponent(sharedData));
        const currentSaved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
        
        // On vérifie si elle n'existe pas déjà (par titre et id)
        const exists = currentSaved.find(l => l.title === decodedList.title && l.id === decodedList.id);
        
        if (!exists) {
          // On génère un nouvel ID pour éviter les conflits si l'autre ré-importe une version modifiée
          const newList = [{ ...decodedList, id: Date.now() }, ...currentSaved];
          localStorage.setItem("warhammer_saved_lists", JSON.stringify(newList));
          setSavedLists(newList);
          
          setSuccessMsg(true);
          setTimeout(() => setSuccessMsg(false), 4500);
          
          // Nettoyage propre de l'URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
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
      
      {/* MESSAGE DE SUCCÈS SCAN */}
      {successMsg && (
        <div className="position-fixed top-0 start-50 translate-middle-x mt-4 z-3 animate__animated animate__fadeInDown">
          <div className="alert bg-info text-dark fw-bold border-0 shadow-lg px-4 py-3 rounded-pill d-flex align-items-center">
            <i className="bi bi-qr-code-scan fs-4 me-3"></i>
            OST DE GUERRE IMPORTÉ AVEC SUCCÈS !
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-white mb-0 text-uppercase tracking-wider">Mes Ost de Guerre</h2>
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
                  <img 
                    src={`/img/banner_${banner}.webp`} 
                    className="card-img-top" 
                    style={{ height: '140px', objectFit: 'cover', opacity: '0.4' }} 
                    onError={(e) => e.target.src="/img/banner_default.webp"} 
                  />
                  
                  {/* BOUTON SUPPRIMER */}
                  <button 
                    onClick={(e) => deleteList(e, list.id)} 
                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-3 opacity-75" 
                    style={{zIndex: 10, borderRadius: '50%', width: '32px', height: '32px'}}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                  
                  {/* BOUTON SHARE / QR CODE */}
                  <button 
                    onClick={() => setShowQR(list)} 
                    className="btn btn-dark btn-sm position-absolute top-0 start-0 m-3 border border-secondary d-flex align-items-center gap-2" 
                    style={{zIndex: 10, borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}}
                  >
                    <i className="bi bi-qr-code-scan text-info"></i>
                    <span className="small text-uppercase fw-bold" style={{fontSize: '0.6rem', letterSpacing: '0.5px'}}>Share</span>
                  </button>

                  <div className="card-body p-4 d-flex flex-column">
                    <div className="mb-4">
                      <small className="text-info fw-bold text-uppercase d-block mb-1" style={{letterSpacing: '1px'}}>{faction}</small>
                      <h5 className="text-white fw-bold text-truncate">{list.title || "Sans nom"}</h5>
                      <h6 className="text-white-50 small">{data?.subFaction || "Générique"}</h6>
                    </div>
                    
                    <div className="d-flex gap-2 mb-4">
                      <div className="flex-fill bg-black bg-opacity-40 rounded-3 p-2 text-center border border-secondary border-opacity-10">
                        <small className="text-secondary d-block text-uppercase mb-1" style={{fontSize: '0.55rem'}}>Régiments</small>
                        <span className="fw-bold text-info">{data?.regiments?.length || 0}</span>
                      </div>
                      <div className="flex-fill bg-black bg-opacity-40 rounded-3 p-2 text-center border border-secondary border-opacity-10">
                        <small className="text-secondary d-block text-uppercase mb-1" style={{fontSize: '0.55rem'}}>Unités</small>
                        <span className="fw-bold text-success">{countTotalUnits(data)}</span>
                      </div>
                    </div>
                    
                    <Link to={`/my-lists/${list.id}`} className="btn btn-outline-light w-100 rounded-pill mt-auto fw-bold py-2">Consulter l'Ost</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE QR CODE */}
      {showQR && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary shadow-lg">
              <div className="modal-header border-0 pb-0">
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowQR(null)}></button>
              </div>
              <div className="modal-body text-center p-5 pt-2">
                <div className="mb-4">
                    <i className="bi bi-qr-code-scan text-info fs-1"></i>
                </div>
                <h4 className="text-white fw-bold mb-2 text-uppercase tracking-wider">Partager l'Ost</h4>
                <p className="text-white-50 small mb-4">Faites scanner ce code à votre adversaire pour lui transférer votre liste d'armée.</p>
                
                <div className="bg-white p-3 d-inline-block rounded-4 shadow-lg mb-4">
                  <QRCodeSVG 
                    value={getShareUrl(showQR)} 
                    size={220} 
                    level="L" 
                  />
                </div>
                
                <div className="text-info fw-bold text-uppercase">{showQR.title}</div>
                <div className="text-muted small">{(showQR.listData || showQR).faction}</div>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-4">
                <button className="btn btn-secondary px-5 rounded-pill fw-bold" onClick={() => setShowQR(null)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}