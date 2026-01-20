import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import lexicon from "../data/lexique_aoe.json";
import manifestationsDetailed from "../data/manifestations_detailed.json";

export default function ImportList() {
  const [text, setText] = useState("");
  const [detectedFaction, setDetectedFaction] = useState(null);
  const navigate = useNavigate();

  const clean = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, "").trim() || "";

  useEffect(() => {
    if (!text.trim()) {
      setDetectedFaction(null);
      return;
    }
    const fullClean = clean(text);
    const found = lexicon.factions.find(f => fullClean.includes(clean(f)));
    setDetectedFaction(found || null);
  }, [text]);

  const handleImport = () => {
    if (!text.trim()) return;

    try {
      const lines = text.split("\n").map(l => l.trim()).filter(l => l !== "");
      const fullClean = clean(text);
      
      // Extraction des Battle Tactics
      const tacticsMatch = text.match(/Battle Tactic Cards:\s*(.*)/i);
      let extractedTactics = [];
      if (tacticsMatch && tacticsMatch[1]) {
        const tacticsLine = tacticsMatch[1].split(",");
        extractedTactics = (lexicon.battletactics || []).filter(t => 
          tacticsLine.some(part => clean(part).includes(clean(t)))
        );
      }

      const allPossibleManifestations = [
        ...Object.keys(manifestationsDetailed.generics || {}),
        ...(lexicon.manifestations || [])
      ];

      let listData = {
        faction: lexicon.factions.find(f => fullClean.includes(clean(f))) || "Inconnue",
        subFaction: lexicon.sub_factions.find(sf => fullClean.includes(clean(sf))) || "Non définie",
        spellLore: lexicon.spell_lores.find(sl => fullClean.includes(clean(sl))) || "Non défini",
        // AJOUT : Extraction du Prayer Lore
        prayerLore: lexicon.prayer.find(p => fullClean.includes(clean(p))) || "Non défini",
        manifestationLore: allPossibleManifestations.find(m => fullClean.includes(clean(m))) || "Non défini",
        factionTerrain: lexicon.terrains.find(t => fullClean.includes(clean(t))) || "Non défini",
        battletactics: extractedTactics,
        regiments: [],
        points: text.match(/(\d+)\s*\/\s*\d+/)?.[1] || "0"
      };

      let currentReg = null;
      let isFirstInReg = false;

      lines.forEach((line) => {
        const lowerLine = line.toLowerCase();
        const cleanLine = clean(line);

        if (lowerLine.includes("regiment") || lowerLine.includes("renown")) {
          if (currentReg) listData.regiments.push(currentReg);
          currentReg = { hero: null, isGeneral: lowerLine.includes("general"), heroOptions: [], units: [] };
          isFirstInReg = true;
          return;
        }

        if (!currentReg) return;

        if (line.startsWith("•") || line.startsWith("-") || lowerLine.includes("reinforced")) {
          if (lowerLine.includes("reinforced")) {
            if (currentReg.units.length > 0) currentReg.units[currentReg.units.length - 1].reinforced = true;
          } else {
            const opt = [...lexicon.traits, ...lexicon.artefacts].find(o => clean(line).includes(clean(o)));
            if (opt) currentReg.heroOptions.push(opt);
          }
          return;
        }

        const allPossibleUnits = [...lexicon.heroes, ...lexicon.units];
        const match = allPossibleUnits.filter(e => cleanLine.includes(clean(e))).sort((a, b) => b.length - a.length)[0];

        if (match) {
          const isHero = lexicon.heroes.some(h => clean(h) === clean(match));
          if (isFirstInReg) {
            currentReg.hero = match;
            isFirstInReg = false;
          } else {
            currentReg.units.push({ name: match, reinforced: lowerLine.includes("reinforced"), type: isHero ? "HERO" : "UNIT" });
          }
        }
      });

      if (currentReg) listData.regiments.push(currentReg);
      const id = Date.now().toString();
      const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
      localStorage.setItem("warhammer_saved_lists", JSON.stringify([{ id, ...listData }, ...saved]));
      
      navigate(`/my-lists/${id}`);
    } catch (e) { alert("Erreur lors de l'analyse."); }
  };

  return (
    <div className="container mt-4 font-monospace">
      <div className="card bg-black border-secondary overflow-hidden shadow-lg">
        <div className="position-relative" style={{ height: '180px', backgroundColor: '#111' }}>
          {detectedFaction ? (
            <img src={`/img/banner_${detectedFaction.toLowerCase().replace(/\s+/g, '')}.webp`} className="w-100 h-100 object-fit-cover opacity-75" />
          ) : (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center border-bottom border-secondary opacity-25">
              <h1 className="text-secondary fw-900 m-0" style={{ letterSpacing: '10px' }}>SCANNER</h1>
            </div>
          )}
        </div>
        <div className="card-body p-4 text-start">
          <textarea className="form-control bg-dark text-white border-secondary mb-3 shadow-none font-monospace" rows="10" value={text} onChange={e => setText(e.target.value)} placeholder="Collez votre export ici..." />
          <button className="btn btn-info w-100 fw-bold py-3" onClick={handleImport}>ANALYSER LA LISTE</button>
        </div>
      </div>
    </div>
  );
}