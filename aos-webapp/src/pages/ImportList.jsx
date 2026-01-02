import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ImportList() {
  const [loading, setLoading] = useState(false);
  const [listData, setListData] = useState(null);
  const [error, setError] = useState(false);
  const [justSavedId, setJustSavedId] = useState(null);
  const [manualText, setManualText] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Utilisation de noms qui matchent tes fichiers banner_X.webp
  const aosFactions = [
    "Helsmiths", "Soulblight Gravelords", "Ossiarch Bonereapers", "Nighthaunt", "Flesh-eater Courts",
    "Stormcast Eternals", "Cities of Sigmar", "Seraphon", "Lumineth Realm-lords",
    "Sylvaneth", "Kharadron Overlords", "Fyreslayers", "Idoneth Deepkin",
    "Skaven", "Slaves to Darkness", "Maggotkin of Nurgle", "Blades of Khorne",
    "Hedonites of Slaanesh", "Disciples of Tzeentch", "Ironjawz", "Kruleboyz",
    "Gloomspite Gitz", "Ogor Mawtribes", "Sons of Behemat", "Daughters of Khaine"
  ];

  // Mots à ignorer pour ne pas les prendre comme des unités
  const blacklist = ["GENERAL", "REINFORCED", "ARMY OF RENOWN", "DROPS", "BATTLE TACTICS", "TRAIT", "ARTIFACT"];

  const processText = (text) => {
    if (!text || text.length < 20) return;
    setLoading(true);
    setError(false);
    setJustSavedId(null);

    setTimeout(() => {
      const parsed = parseWarhammerList(text);
      if (parsed.faction !== "Inconnue") {
        setListData(parsed);
        setShowManualInput(false);
      } else {
        setError(true);
      }
      setLoading(false);
    }, 800);
  };

  const parseWarhammerList = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l !== "");
    const data = { 
      name: "Ma Liste",
      faction: "Inconnue", subFaction: "Non définie", spellLore: "Non défini",
      manifestationLore: "Non défini", prayerLore: "Non défini",
      battleTactics: "Non défini", terrain: "Non défini", regiments: [] 
    };
    
    let currentRegiment = null;

    lines.forEach((line, index) => {
      const upperLine = line.toUpperCase();
      
      // 1. DÉTECTION DU NOM ET DE LA FACTION
      if (index === 0 && line.includes("—")) {
        data.name = line.split("—")[0].replace(/\[.*?\]/, "").trim();
      }

      if (data.faction === "Inconnue") {
        const found = aosFactions.find(f => upperLine.includes(f.toUpperCase()));
        if (found) {
          data.faction = found; // Sera "Helsmiths"
          if (line.includes("|")) {
            data.subFaction = line.split("|").pop().trim();
          }
        }
      }

      // 2. MÉDATAONNÉES
      const extractValue = (l) => l.split(/[:\-]/).slice(1).join("-").trim();
      if (upperLine.includes("SPELL LORE")) data.spellLore = extractValue(line);
      if (upperLine.includes("MANIFESTATION LORE")) data.manifestationLore = extractValue(line);
      if (upperLine.includes("PRAYER LORE")) data.prayerLore = extractValue(line);
      if (upperLine.includes("BATTLE TACTICS")) data.battleTactics = extractValue(line);

      // 3. RÉGIMENTS
      if ((upperLine.includes("REGIMENT") || upperLine.includes("FORGEHOST")) && !line.includes("|")) {
        if (currentRegiment) data.regiments.push(currentRegiment);
        currentRegiment = { name: line.trim(), units: [] };
        return;
      }
      
      // 4. UNITÉS (Correction du scan "General" et "Reinforced")
      if (currentRegiment) {
        const hasPoints = /\(\d+.*?\)$/.test(line);
        // On vérifie que la ligne n'est pas dans la blacklist
        const isBlacklisted = blacklist.some(word => upperLine.includes(word));

        if (hasPoints && !isBlacklisted) {
          const unitName = line
            .replace(/\(\d+.*?\)$/, "")     
            .replace(/^[•\-\*]\s+/, "")  
            .replace(/^\d+x\s+/, "")     
            .trim();
          
          if (unitName.length > 2) {
            currentRegiment.units.push(unitName);
          }
        }
      }
    });

    if (currentRegiment) data.regiments.push(currentRegiment);
    return data;
  };

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
    const id = Date.now();
    const allUnits = listData.regiments.flatMap(r => r.units);
    const newList = { ...listData, units: allUnits, id, createdAt: id };
    localStorage.setItem("warhammer_saved_lists", JSON.stringify([newList, ...saved]));
    setJustSavedId(id);
  };

  return (
    <div className="container mt-4 pb-5">
      <h2 className="text-center fw-bold mb-4 text-uppercase">Importateur</h2>
      
      {!loading && !listData && (
        <div className="text-center mb-4 card bg-dark p-4 p-md-5 border-0 shadow rounded-4">
          <button className="btn btn-primary btn-lg shadow px-5 py-3 fw-bold mb-3 w-100" onClick={async () => {
            try { 
              const text = await navigator.clipboard.readText(); 
              processText(text); 
            } catch { 
              setShowManualInput(true); 
            }
          }}>📋 COLLER LA LISTE</button>
          <button className="btn btn-outline-secondary btn-sm border-0" onClick={() => setShowManualInput(!showManualInput)}>
            {showManualInput ? "Annuler" : "Saisie manuelle"}
          </button>
        </div>
      )}

      {loading && <div className="text-center my-5"><div className="spinner-border text-primary"></div></div>}

      {showManualInput && !listData && !loading && (
        <div className="card shadow-lg border-0 bg-dark rounded-4 mb-4 p-4">
          <textarea className="form-control bg-black text-white border-secondary mb-3" rows="10" 
            value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Collez ici..."></textarea>
          <button className="btn btn-success w-100 py-3 fw-bold" onClick={() => processText(manualText)}>DÉCODER</button>
        </div>
      )}

      {listData && !loading && (
        <div className="card shadow-lg border-0 bg-dark text-white rounded-4 overflow-hidden animate__animated animate__fadeIn">
          <div className="card-body p-4">
            <div className="mb-4 text-center">
              <span className="badge bg-success mb-2">ANALYSE TERMINÉE</span>
              <h2 className="fw-bold mb-0 text-uppercase">{listData.name}</h2>
              <p className="text-info fs-5 mb-0 fw-bold">{listData.faction}</p>
              <small className="text-white-50">{listData.subFaction}</small>
            </div>
            
            <div className="p-3 bg-white bg-opacity-10 rounded border border-white border-opacity-25 mb-4 text-center">
                <h6 className="mb-0 fw-bold text-white">Composition</h6>
                <p className="small mb-0 text-white-50">
                  {listData.regiments.length} Régiment(s) • {listData.regiments.reduce((acc, r) => acc + r.units.length, 0)} Unités
                </p>
            </div>

            <div className="pt-3 border-top border-secondary border-opacity-25">
              {!justSavedId ? (
                <button className="btn btn-success btn-lg w-100 py-3 fw-bold" onClick={handleSave}>💾 SAUVEGARDER</button>
              ) : (
                <div className="row g-2">
                  <div className="col-12">
                    <Link to={`/my-lists/${justSavedId}`} className="btn btn-info btn-lg text-white w-100 py-3 fw-bold">👁️ VOIR MA LISTE</Link>
                  </div>
                  <div className="col-12">
                    <button className="btn btn-outline-secondary w-100 py-2 mt-2" onClick={() => setListData(null)}>🔄 AUTRE IMPORT</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}