import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";

export default function MyListWarscroll() {
  const { id, unitSlug } = useParams();
  const [list, setList] = useState(null);
  const [cleanHTML, setCleanHTML] = useState("");
  const [profile, setProfile] = useState(null);
  const [warscroll, setWarscroll] = useState(null);

  const cleanDisplayTitle = (name) => {
    return name
      .replace(/^Legion of the First Prince\s+/i, "")
      .replace(/^Scourge of Ghyran\s+/i, "")
      .trim();
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    const foundList = saved.find(l => l.id.toString() === id);
    if (!foundList) return;
    setList(foundList);

    let normalizedSlug = unitSlug.toLowerCase().replace(/-/g, " ");
    if (normalizedSlug.startsWith("sog ")) {
      normalizedSlug = normalizedSlug.replace("sog ", "scourge of ghyran ");
    }
    const target = normalizedSlug.replace(/[^a-z0-9]/g, "");

    const allWarscrolls = Object.values(warscrollsData).flatMap(cat => 
      Object.values(cat).flatMap(faction => faction)
    );

    const matches = allWarscrolls.filter(ws => {
      const cleanJsonSlug = ws.searchSlug || "";
      return cleanJsonSlug === target || cleanJsonSlug.includes(target);
    });

    const foundWs = matches.sort((a, b) => b.name.length - a.name.length)[0];
    
    if (foundWs) {
      setWarscroll(foundWs);
      const parser = new DOMParser();
      const doc = parser.parseFromString(foundWs.html, "text/html");

      doc.querySelectorAll(".wsWeaponAbility").forEach((el) => {
        const badge = document.createElement("span");
        badge.className = "badge text-bg-warning ms-1 fw-bold p-1";
        badge.style.fontSize = "11px";
        badge.style.textAlign = "left";
        badge.style.display = "inline-block";
        const contentWithBreaks = el.innerHTML.replace(/,/g, ",<br/>");
        badge.innerHTML = contentWithBreaks;
        el.replaceWith(badge);
      });

      doc.querySelectorAll(".wsHeader_short, .abLogo, .ShowFluff.legend4, .wsHeader_long, .wsDataRow.wsDataRow_short, .wsDataCell_short.wsBorderN_.dsColorFrFE, .BreakInsideAvoid.PitchedBattleProfile.ShowPitchedBattleProfile").forEach((el) => el.remove());
      doc.querySelectorAll(".abHeader span").forEach((span) => { span.replaceWith(span.textContent); });
      doc.querySelectorAll("table img").forEach(img => img.remove());
      
      doc.querySelectorAll(".wTable tr").forEach((tr) => {
        const firstTd = tr.querySelector("td");
        if (firstTd && firstTd.textContent.trim() === "") firstTd.remove();
      });

      const profileDiv = doc.querySelector(".AoS_profile, .AoS_profile_Ward, .AoS_profile_Manifestation");
      if (profileDiv) {
        setProfile({
          move: profileDiv.querySelector(".wsMove")?.textContent.trim() || "-",
          wounds: profileDiv.querySelector(".wsWounds")?.textContent.trim() || "-",
          save: profileDiv.querySelector(".wsSave")?.textContent.trim() || "-",
          control: profileDiv.querySelector(".wsBravery")?.textContent.trim() || "-",
          ward: profileDiv.querySelector(".wsWard")?.textContent.trim() || null,
        });
      }
      setCleanHTML(doc.body.innerHTML);
    }
  }, [id, unitSlug]);

  if (!warscroll) return <div className="container mt-5 text-white text-center">Chargement...</div>;

  const factionKey = list?.faction?.toLowerCase().replace(/\s+/g, "") || "default";

  return (
    <div className="position-relative min-vh-100">
      <div 
        className="fixed-top w-100 h-100" 
        style={{
          backgroundImage: `url('/banners/banner_${factionKey}.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(15px) brightness(0.6)',
          opacity: '0.5',
          zIndex: '-1',
          pointerEvents: 'none'
        }}
      ></div>

      <div className="container pb-4 animate__animated animate__fadeIn">
        <Link to={`/my-lists/${id}`} className="btn btn-outline-light btn-sm mb-4 shadow-sm">← Retour</Link>
        <h2 className="mb-4 text-center text-white text-uppercase fw-bold shadow-text">
          {cleanDisplayTitle(warscroll.name)}
        </h2>

        {/* --- AJOUT DE L'IMAGE DE L'UNITÉ --- */}
        <div className="text-center bg-white rounded-3 mb-4 border-3 border border-warning">
          <img 
            src={`/img/units/${unitSlug}.jpg`} 
            alt={warscroll.name}
            className="img-fluid"
            style={{ maxHeight: '180px', objectFit: 'contain' }}
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
        
        {profile && (
          <ul className="nav nav-pills nav-fill mb-3 bg-dark bg-opacity-75 rounded p-2 border border-secondary border-opacity-25 shadow">
            <li className="nav-item text-center text-white">
              <span className="d-block fs-4 fw-bold">{profile.move}</span>
              <small className="text-secondary">Move</small>
            </li>
            <li className="nav-item text-center text-white border-start border-secondary border-opacity-25">
              <span className="d-block fs-4 fw-bold">{profile.wounds}</span>
              <small className="text-secondary">Wounds</small>
            </li>
            <li className="nav-item text-center text-white border-start border-secondary border-opacity-25">
              <span className="d-block fs-4 fw-bold">{profile.control}</span>
              <small className="text-secondary">Control</small>
            </li>
            <li className="nav-item text-center text-white border-start border-secondary border-opacity-25">
              <span className="d-block fs-4 fw-bold save">{profile.save}</span>
              <small className="text-secondary">Save</small>
            </li>
            {profile.ward && (
              <li className="nav-item text-center text-white border-start border-secondary border-opacity-25">
                <span className="d-block fs-4 fw-bold ward">{profile.ward}</span>
                <small className="text-secondary">Ward</small>
              </li>
            )}
          </ul>
        )}

        <div className="warscroll-content card p-2 shadow-lg text-dark overflow-hidden rounded-4">
          <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
        </div>
      </div>
      
      <style>{`
        .save { color: #ffd700; }
        .ward { color: #00d4ff; }
        .shadow-text { text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
        .wsKeywordLine1 { background: black !important; color: white !important; padding: 10px !important; margin: 10px 0; font-weight: bold; text-transform: uppercase; }
        .wsAbilityTable { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .wsAbilityHeader { background: #444; color: #fff; padding: 5px; font-size: 0.8rem; }
        .wsAbilityCell { padding: 8px; border-bottom: 1px solid #eee; font-size: 0.9rem; }
        .warscroll-content table { width: 100% !important; }

        @media (max-width: 768px) {
          .wsKeywordHeader { display: none !important; }
        }
      `}</style>
    </div>
  );
}