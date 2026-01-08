import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";

export default function WarscrollDetail() {
  const { category, faction, warscrollSlug } = useParams();
  const [cleanHTML, setCleanHTML] = useState("");
  const [profile, setProfile] = useState(null);
  const [warscroll, setWarscroll] = useState(null);
  const [realFactionName, setRealFactionName] = useState("");

  const bannerMapping = {
    "Helsmiths": "helsmiths", "Ossiarch Bonereapers": "ossiarch", 
    "Soulblight Gravelords": "soulblight", "Nighthaunt": "nighthaunt", 
    "Flesh-eater Courts": "flesheater", "Sons of Behemat": "sonsofbehemat", 
    "Idoneth Deepkin": "idoneth", "Blades of Khorne": "khorne", 
    "Sylvaneth": "sylvaneth", "Disciples of Tzeentch": "tzeentch", 
    "Ironjawz": "ironjawz", "Gloomspite Gitz": "gloomspite", 
    "Slaves to Darkness": "slaves", "Lumineth Realm-lords": "lumineth", 
    "Hedonites of Slaanesh": "slaanesh", "Skaven": "skaven", 
    "Daughters of Khaine": "daughtersofkhaine", "Kruleboyz": "kruleboyz", 
    "Kharadron Overlords": "kharadron", "Cities of Sigmar": "citiesofsigmar", 
    "Fyreslayers": "fyreslayers", "Seraphon": "seraphon", 
    "Stormcast Eternals": "stormcast", "Maggotkin of Nurgle": "nurgle", 
    "Ogor Mawtribes": "ogor"
  };

  useEffect(() => {
    const catKey = category ? category.toLowerCase() : "";
    const allianceData = warscrollsData[catKey] || {};
    
    const factionKey = Object.keys(allianceData).find(
      (key) => key.toLowerCase().replace(/[\s-]/g, "") === faction.toLowerCase().replace(/[\s-]/g, "")
    );

    if (!factionKey) return;
    setRealFactionName(factionKey);

    const factionUnits = allianceData[factionKey] || [];
    const foundWs = factionUnits.find((ws) => ws.slug === warscrollSlug);
    
    if (!foundWs) return;
    setWarscroll(foundWs);

    const parser = new DOMParser();
    const doc = parser.parseFromString(foundWs.html, "text/html");

    // Nettoyage des éléments indésirables
    doc.querySelectorAll(".wsTable img, .abLogo, .ShowFluff.legend4, .wsDataRow.wsDataRow_short, .BreakInsideAvoid.PitchedBattleProfile").forEach(img => img.remove());
    
    // Remplacement des liens par des spans
    doc.querySelectorAll("a").forEach(a => {
      const span = doc.createElement("span");
      span.innerHTML = a.innerHTML;
      span.style.borderBottom = "1px dotted #666";
      a.parentNode.replaceChild(span, a);
    });

    // Style des badges d'habilité d'arme (RÉDUIT)
    doc.querySelectorAll(".wsWeaponAbility").forEach(el => {
      el.classList.add("badge", "bg-warning", "text-dark", "me-1", "mb-1", "fw-bold");
      el.style.fontSize = "0.6rem"; 
      el.innerHTML = el.innerHTML.split(",").join(",<br/>");
    });

    // Truncate sur wsDataCell_long & Remplacement Melee/Ranged
    doc.querySelectorAll(".wsDataCell_long").forEach(el => {
      const text = el.textContent.trim().toUpperCase();
      if (text === "MELEE WEAPONS") {
        el.innerHTML = 'MELEE ⚔️';
      } else if (text === "RANGED WEAPONS") {
        el.innerHTML = 'RANGED 🏹';
      }
      el.style.maxWidth = "110px";
      el.style.overflow = "hidden";
      el.style.textOverflow = "ellipsis";
      el.style.whiteSpace = "nowrap";
    });

    const getTxt = (selector) => doc.querySelector(selector)?.textContent.trim() || null;

    setProfile({
      move: getTxt(".wsMove") || "-",
      health: getTxt(".wsWounds") || "-",
      save: getTxt(".wsSave") || "-",
      control: getTxt(".wsBravery") || "-",
      ward: getTxt(".wsWard")
    });

    doc.querySelectorAll(".wsTable tr").forEach((row) => {
      const firstCell = row.querySelector(".wsDataCell_long");
      if (firstCell) firstCell.remove();
    });

    doc.querySelectorAll(".abHeader").forEach((header) => {
      const text = header.textContent.trim();
      header.innerHTML = text; 
    });

    doc.querySelectorAll(".AoS_profile, .wsHeader_short, .wsHeader_long").forEach((el) => el.remove());

    setCleanHTML(doc.body.innerHTML);
  }, [category, faction, warscrollSlug]);

  if (!warscroll) return <div className="text-white p-5 text-center">Chargement...</div>;

  return (
    <div className="min-vh-100">
      <div className="fixed-top w-100 vh-100" style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.95)), url(/img/banner_${bannerMapping[realFactionName] || 'default'}.webp)`,
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', zIndex: -1
      }} />

      <div className="container pb-5 position-relative">
        <div className="mb-4 pt-3">
          <Link to={-1} className="btn btn-outline-light btn-sm mb-3 opacity-75 shadow-sm">← Retour</Link>
          <h2 className="text-white fw-bold text-uppercase shadow-text display-6">
            {warscroll.name}
          </h2>
        </div>

        <div className="text-center mb-4 overflow-hidden bg-white border border-3 border-warning rounded-3 shadow-lg">
          {(() => {
            const displayImageSlug = warscrollSlug.replace(/^scourge-of-ghyran-/, "");
            return (
                <img 
                  src={`/img/units/${displayImageSlug}.webp`} 
                  alt="" 
                  className="img-fluid unit-image-blend" 
                  style={{ maxHeight: '220px', objectFit: 'contain', transform: 'scale(1.1)' }} 
                  onError={(e) => {
                    if (e.target.src.endsWith('.webp')) { e.target.src = `/img/units/${displayImageSlug}.jpg`; } 
                    else { e.target.style.display = 'none'; }
                  }} 
                />
              );
          })()}       
        </div>

        {profile && (
          <ul className="nav nav-pills nav-justified bg-dark bg-opacity-75 rounded-4 p-2 mb-4 shadow border border-secondary border-opacity-25 blur-bg">
            <li className="nav-item text-center text-white"><span className="d-block fs-4 fw-bold">{profile.move}</span><small className="text-secondary text-uppercase" style={{fontSize: '0.6rem'}}>Move</small></li>
            <li className="nav-item text-center text-white border-start border-secondary border-opacity-25"><span className="d-block fs-4 fw-bold">{profile.health}</span><small className="text-secondary text-uppercase" style={{fontSize: '0.6rem'}}>Health</small></li>
            <li className="nav-item text-center text-white border-start border-secondary border-opacity-25"><span className="d-block fs-4 fw-bold">{profile.control}</span><small className="text-secondary text-uppercase" style={{fontSize: '0.6rem'}}>Control</small></li>
            <li className="nav-item text-center text-white border-start border-secondary border-opacity-25"><span className="d-block fs-4 fw-bold save">{profile.save}</span><small className="text-secondary text-uppercase" style={{fontSize: '0.6rem'}}>Save</small></li>
            {profile.ward && profile.ward !== "-" && (
              <li className="nav-item text-center text-white border-start border-secondary border-opacity-25"><span className="d-block fs-4 fw-bold ward">{profile.ward}</span><small className="text-secondary text-uppercase" style={{fontSize: '0.6rem'}}>Ward</small></li>
            )}
          </ul>
        )}

        <div className="warscroll-content card shadow-lg text-dark overflow-hidden bg-transparent rounded-4 border-0 mb-5">
          <div className="table-responsive">
            <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
          </div>
        </div>
      </div>

      <style>{`
        .blur-bg { backdrop-filter: blur(8px); }
        .shadow-text { text-shadow: 2px 2px 8px rgba(0,0,0,0.9); }        
        .wsKeywordLine1 { background: black !important; color: white !important; padding: 10px !important; margin: 10px 0; font-weight: bold; text-transform: uppercase; border-radius: 4px; font-size: 0.75rem; }
        .wsAbilityTable { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .wsAbilityHeader { background: #333; color: #fff; padding: 5px; font-size: 0.7rem; text-transform: uppercase; }
        .wsAbilityCell { padding: 6px; border: 1px solid #dee2e6; font-size: 0.75rem; }
        .wsTable { width: 100%; margin-bottom: 1rem; }
        /* Réduction globale de la taille des polices du tableau */
        .wsDataCell { padding: 6px 4px; text-align: center; border: 1px solid #dee2e6; font-weight: bold; font-size: 0.7rem !important; }
        .wsHeaderCell { font-size: 0.6rem !important; background: #f8f9fa; text-transform: uppercase; padding: 6px 4px; border: 1px solid #dee2e6; color: #666; }
        .abHeader { font-weight: bold; padding: 5px 0; display: block; text-transform: uppercase; border-bottom: 1px solid rgba(0,0,0,0.1); margin-bottom: 5px; font-size: 0.8rem; }
        .table-responsive { display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  );
}