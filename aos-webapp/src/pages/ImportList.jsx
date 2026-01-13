import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ImportList() {
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const handleImport = () => {
    if (!text.trim()) return;

    try {
      const allLines = text.split("\n").map(l => l.trim());
      
      // Nettoyage strict des lignes inutiles
      const filteredLines = allLines.filter(l => 
        l !== "" && 
        !l.startsWith("---") && 
        !l.toLowerCase().includes("created with") &&
        !l.toLowerCase().includes("app: v")
      );

      let listData = {
        faction: "Générique",
        subFaction: "Non définie",
        spellLore: "Non défini",
        manifestationLore: "Non défini",
        factionTerrain: "Non défini",
        battle_tactics: [],
        regiments: [],
        points: "0",
        customTitle: "Ma Liste"
      };

      // 1. Titre et Points Totaux
      if (filteredLines.length > 0) {
        listData.customTitle = filteredLines[0].replace(/\d+\/\d+\s*(pts|points)/gi, "").trim();
      }

      let currentRegiment = null;

      filteredLines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();

        // 2. Points (détection sur n'importe quelle ligne)
        const ptsMatch = line.match(/(\d+)\/(\d+)\s*(pts|points)/i);
        if (ptsMatch) {
          listData.points = ptsMatch[1];
          return;
        }

        // 3. Faction | Subfaction (format: GA | Faction | Sub)
        if (line.includes("|")) {
          const parts = line.split("|").map(p => p.trim());
          if (parts.length >= 3) {
            listData.faction = parts[1];
            listData.subFaction = parts[2];
          } else if (parts.length === 2) {
            listData.faction = parts[0];
            listData.subFaction = parts[1];
          }
          return;
        }

        // 4. Lores
        if (lowerLine.includes("spell lore")) {
          listData.spellLore = line.split(/[-:]/)[1]?.split("(")[0]?.trim();
          return;
        }
        if (lowerLine.includes("manifestation lore")) {
          listData.manifestationLore = line.split(/[-:]/)[1]?.split("(")[0]?.trim();
          return;
        }

        // 5. Battle Tactics
        if (lowerLine.includes("battle tactics")) {
          const content = line.split(/cards:|tactics:|tactique:/i)[1];
          if (content) {
            listData.battle_tactics = content.split(/, | and | et /i).map(t => t.trim()).filter(Boolean);
          }
          return;
        }

        // 6. Terrain
        if (lowerLine.includes("faction terrain")) {
          const terrainName = filteredLines[index + 1];
          if (terrainName) listData.factionTerrain = terrainName;
          return;
        }

        // 7. DÉTECTION DES RÉGIMENTS (LA LOGIQUE FIXÉE ICI)
        // On détecte "General's Regiment" OU "Regiment X"
        const isNewRegiment = lowerLine.includes("general's regiment") || 
                             (lowerLine.includes("regiment") && !lowerLine.includes("battle tactics") && !lowerLine.includes("renown"));

        if (isNewRegiment) {
          if (currentRegiment) listData.regiments.push(currentRegiment);
          currentRegiment = { hero: null, heroOptions: [], units: [] };
          return;
        }

        // 8. Unités (Nom + Points entre parenthèses)
        const unitMatch = line.match(/^(.+?)\s\((\d+)\)$/);
        if (unitMatch && currentRegiment) {
          const unitName = unitMatch[1].replace(/^[•\d+x\s]+/, "").trim();
          if (!currentRegiment.hero) {
            currentRegiment.hero = unitName;
          } else {
            currentRegiment.units.push(unitName);
          }
          return;
        }

        // 9. Options (Traits, Artefacts)
        if (line.startsWith("•") && currentRegiment && currentRegiment.hero) {
          const opt = line.replace("•", "").trim();
          // On ignore les tags de structure
          if (!["reinforced", "general"].includes(opt.toLowerCase())) {
            currentRegiment.heroOptions.push(opt);
          }
          return;
        }
      });

      // Dernier régiment
      if (currentRegiment) listData.regiments.push(currentRegiment);

      // Nettoyage final : suppression des régiments vides (ex: si "Regiment" est lu en doublon)
      listData.regiments = listData.regiments.filter(r => r.hero !== null);

      const newId = Date.now().toString();
      const newList = {
        id: newId,
        title: listData.customTitle,
        ...listData,
        listData: listData 
      };

      const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
      localStorage.setItem("warhammer_saved_lists", JSON.stringify([newList, ...saved]));

      navigate(`/my-lists/${newId}`);

    } catch (err) {
      console.error(err);
      alert("Erreur import");
    }
  };

  return (
    <div className="container mt-4 pb-5 px-3">
      <div className="card bg-dark border-secondary shadow-lg overflow-hidden">
        <div className="card-header bg-black py-3 text-center border-bottom border-secondary">
          <h5 className="mb-0 fw-bold text-info text-uppercase">Importateur AOS 4.0</h5>
        </div>
        <div className="card-body p-4">
          <textarea
            className="form-control bg-black text-white border-secondary mb-4 shadow-none"
            rows="15"
            style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
            placeholder="Collez votre liste ici..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <button className="btn btn-info fw-bold w-100 py-3 shadow-sm" onClick={handleImport}>
            🚀 Analyser et Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}