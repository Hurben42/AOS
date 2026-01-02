import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";
import Breadcrumb from "../components/Breadcrumb";

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
          backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.9)), url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          zIndex: -1
        }}
      />

      <div className="container pb-5 position-relative">
        
        <div className="mb-4">
          <Link to={`/category/${category}/faction/${faction}`} className="btn btn-outline-light btn-sm mb-3 opacity-75 shadow-sm">
            ← Retour
          </Link>
          <h2 className="text-white fw-bold text-uppercase shadow-text display-6">
            {warscroll.name.replace(/^Legion of the First Prince\s+/i, "").replace(/^Scourge of Ghyran\s+/i, "").trim()}
          </h2>
        </div>

        {/* Image de l'unité avec suppression du fond blanc par CSS */}
        <div className="text-center mb-4 bg-white rounded-3 border border-3 border-warning overflow-hidden">
          <img 
            src={`/img/units/${warscrollSlug}.jpg`} 
            alt={warscroll?.name}
            className="img-fluid"
            style={{ maxHeight: '180px', objectFit: 'cover', width: 'auto', transform: 'scale(1.7)' }}
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
            {profile.ward && (
              <li className="nav-item text-center text-white border-start border-secondary border-opacity-25">
                <span className="d-block fs-4 fw-bold ward">{profile.ward}</span>
                <small className="text-secondary text-uppercase" style={{fontSize: '0.65rem'}}>Ward</small>
              </li>
            )}
          </ul>
        )}

        <div className="warscroll-content card p-2 shadow-lg text-dark overflow-hidden rounded-4 border-0">
          <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
        </div>
      </div>

      <style>{`
        .blur-bg { backdrop-filter: blur(8px); }
        .save { color: #ffd700; }
        .ward { color: #00d4ff; }
        .shadow-text { text-shadow: 2px 2px 8px rgba(0,0,0,0.9); }
        .wsKeywordLine1 { background: black !important; color: white !important; padding: 10px !important; margin: 10px 0; font-weight: bold; text-transform: uppercase; border-radius: 4px; }
        .wsAbilityTable { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .wsAbilityHeader { background: #444; color: #fff; padding: 5px; font-size: 0.8rem; }
        .wsAbilityCell { padding: 8px; border: 1px solid #ddd; }
        .wsTable { width: 100%; margin-bottom: 1rem; }
        .wsDataCell, .wsDataCell_short { padding: 5px; text-align: center; border: 1px solid #eee; }
      `}</style>
    </div>
  );
}