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
    "Helsmiths": "helsmiths",
    "Ossiarch Bonereapers": "ossiarch", 
    "Soulblight Gravelords": "soulblight",
    "Nighthaunt": "nighthaunt", 
    "Flesh-eater Courts": "flesheater",
    "Sons of Behemat": "sonsofbehemat", 
    "Idoneth Deepkin": "idoneth",
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

    // 1. Supprime les images dans les tableaux d'armes
    doc.querySelectorAll(".wsTable img").forEach(img => img.remove());

    // 2. Remplace les liens <a> par des <span> avec bordure pointillée
    doc.querySelectorAll("a").forEach(a => {
      const span = doc.createElement("span");
      span.innerHTML = a.innerHTML;
      span.style.borderBottom = "1px dotted #666";
      span.style.cursor = "default";
      a.parentNode.replaceChild(span, a);
    });

    // 3. Formatage des aptitudes d'armes (badges jaunes + sauts de ligne)
    doc.querySelectorAll(".wsWeaponAbility").forEach(el => {
      el.classList.add("badge", "bg-warning", "text-dark", "me-1", "mb-1", "fw-bold");
      const content = el.innerHTML;
      if (content.includes(",")) {
        el.innerHTML = content.split(",").join(",<br/>");
      }
    });

    const getTxt = (selector) => {
      const el = doc.querySelector(selector);
      return el ? el.textContent.trim() : null;
    };

    setProfile({
      move: getTxt(".wsMove") || "-",
      health: getTxt(".wsWounds") || "-",
      save: getTxt(".wsSave") || "-",
      control: getTxt(".wsBravery") || "-",
      ward: getTxt(".wsWard")
    });

    // 4. Nettoyage des colonnes et éléments superflus
    doc.querySelectorAll(".wsTable tr").forEach((row) => {
      const firstCell = row.querySelector(".wsDataCell_long");
      if (firstCell) firstCell.remove();
    });

    doc.querySelectorAll(
      ".AoS_profile, .wsHeader_short, .wsHeader_long, .abLogo, .ShowFluff.legend4, .wsDataRow.wsDataRow_short, .BreakInsideAvoid.PitchedBattleProfile"
    ).forEach((el) => el.remove());

    doc.querySelectorAll(".abHeader span").forEach((span) => {
      span.replaceWith(span.textContent);
    });

    setCleanHTML(doc.body.innerHTML);
  }, [category, faction, warscrollSlug]);

  if (!warscroll) return <div className="text-white p-5 text-center">Chargement...</div>;

  const bannerImgName = bannerMapping[realFactionName] || "default";
  const backgroundUrl = `/img/banner_${bannerImgName}.webp`;

  return (
    <div className="min-vh-100">
      <div 
        className="fixed-top w-100 vh-100" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.95)), url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          zIndex: -1
        }}
      />

      <div className="container pb-5 position-relative">
        <div className="mb-4 pt-3">
          <Link to={`/category/${category}/faction/${faction}`} className="btn btn-outline-light btn-sm mb-3 opacity-75 shadow-sm">
            ← Retour
          </Link>
          <h2 className="text-white fw-bold text-uppercase shadow-text display-6">
            {warscroll.name.replace(/^Legion of the First Prince\s+/i, "").replace(/^Scourge of Ghyran\s+/i, "").trim()}
          </h2>
        </div>

        <div className="text-center mb-4 overflow-hidden bg-white border border-3 border-warning rounded-3">
          <img 
            src={`/img/units/${warscrollSlug}.jpg`} 
            alt={warscroll?.name}
            className="img-fluid unit-image-blend"
            style={{ maxHeight: '220px', objectFit: 'contain', transform: 'scale(1.2)' }}
            onError={(e) => e.target.style.display = 'none'} 
          />
        </div>

        {profile && (
          <ul className="nav nav-pills nav-justified bg-dark bg-opacity-75 rounded-4 p-2 mb-4 shadow border border-secondary border-opacity-25 blur-bg">
            <li className="nav-item text-center text-white">
              <span className="d-block fs-4 fw-bold">{profile.move}</span>
              <small className="text-secondary text-uppercase" style={{fontSize: '0.65rem'}}>Move</small>
            </li>
            <li className="nav-item text-center text-white border-start border-secondary border-opacity-25">
              <span className="d-block fs-4 fw-bold">{profile.health}</span>
              <small className="text-secondary text-uppercase" style={{fontSize: '0.65rem'}}>Health</small>
            </li>
            <li className="nav-item text-center text-white border-start border-secondary border-opacity-25">
              <span className="d-block fs-4 fw-bold">{profile.control}</span>
              <small className="text-secondary text-uppercase" style={{fontSize: '0.65rem'}}>Control</small>
            </li>
            <li className="nav-item text-center text-white border-start border-secondary border-opacity-25">
              <span className="d-block fs-4 fw-bold save">{profile.save}</span>
              <small className="text-secondary text-uppercase" style={{fontSize: '0.65rem'}}>Save</small>
            </li>
            {profile.ward && profile.ward !== "-" && (
              <li className="nav-item text-center text-white border-start border-secondary border-opacity-25">
                <span className="d-block fs-4 fw-bold ward">{profile.ward}</span>
                <small className="text-secondary text-uppercase" style={{fontSize: '0.65rem'}}>Ward</small>
              </li>
            )}
          </ul>
        )}

        <div className="warscroll-content card p-3 shadow-lg text-dark overflow-hidden rounded-4 border-0">
          <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
        </div>
      </div>

      <style>{`
        .blur-bg { backdrop-filter: blur(8px); }
        .save { color: #ffd700; }
        .ward { color: #00d4ff; }
        .shadow-text { text-shadow: 2px 2px 8px rgba(0,0,0,0.9); }        
        .wsKeywordLine1 { background: black !important; color: white !important; padding: 10px !important; margin: 10px 0; font-weight: bold; text-transform: uppercase; border-radius: 4px; font-size: 0.8rem; }
        .wsAbilityTable { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .wsAbilityHeader { background: #333; color: #fff; padding: 6px; font-size: 0.8rem; text-transform: uppercase; }
        .wsAbilityCell { padding: 8px; border: 1px solid #dee2e6; font-size: 0.9rem; }
        .wsTable { width: 100%; margin-bottom: 1rem; }
        .wsDataCell, .wsDataCell_short { padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: bold; }
        .abHeader { font-weight: bold; padding-bottom: 3px; display: block; text-transform: uppercase; color: #fff; }
      `}</style>
    </div>
  );
}