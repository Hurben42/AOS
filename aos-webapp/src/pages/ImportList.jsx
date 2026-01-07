import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ImportList() {
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const handleImport = () => {
    if (!text.trim()) return;

    try {
      const allLines = text.split("\n").map(l => l.trim());
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

      if (filteredLines.length > 0) {
        let title = filteredLines[0];
        if (title.includes(" - ")) {
          title = title.split(" - ").slice(1).join(" - ");
        }
        listData.customTitle = title.replace(/\d+\/\d+\s*(pts|points)/gi, "").trim();
      }

      let currentRegiment = null;

      filteredLines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();

        if (lowerLine.includes("battle tactics") || lowerLine.includes("tactiques de bataille")) {
          const content = line.split(/cards:|tactics:|tactique:/i)[1];
          if (content) {
            const tactics = content.split(/\s+and\s+|\s+et\s+|,/i);
            tactics.forEach(t => {
              const cleanTactic = t.trim();
              if (cleanTactic) listData.battle_tactics.push(cleanTactic);
            });
          }
          return;
        }

        if (line.includes("|")) {
          const parts = line.split("|").map(p => p.trim());
          if (parts.length >= 2) {
            const alliances = ["grand alliance chaos", "grand alliance death", "grand alliance destruction", "grand alliance order"];
            if (alliances.includes(parts[0].toLowerCase()) && parts.length >= 3) {
              listData.faction = parts[1];
              listData.subFaction = parts[2];
            } else {
              listData.faction = parts[0];
              listData.subFaction = parts[1];
            }
          }
        }

        if (lowerLine.includes("spell lore") || lowerLine.includes("manifestation lore") || lowerLine.includes("prayer lore")) {
          const separator = line.includes(":") ? ":" : "-";
          const value = line.split(separator)[1]?.split("(")[0]?.trim();
          if (lowerLine.includes("spell lore")) listData.spellLore = value;
          if (lowerLine.includes("manifestation lore")) listData.manifestationLore = value;
        }

        if (lowerLine.includes("faction terrain")) {
          const terrainName = filteredLines[index + 1];
          if (terrainName) listData.factionTerrain = terrainName;
        }

        if (lowerLine.includes("regiment") || lowerLine.includes("general's")) {
          if (currentRegiment) listData.regiments.push(currentRegiment);
          currentRegiment = { hero: null, units: [] };
        }

        const unitMatch = line.match(/^(.+?)\s\((\d+)\)$/);
        if (unitMatch) {
          const unitName = unitMatch[1].replace(/^[•\d+x\s]+/, "").trim();
          const unitPoints = unitMatch[2];
          if (currentRegiment) {
            if (!currentRegiment.hero) currentRegiment.hero = { name: unitName, points: unitPoints };
            else currentRegiment.units.push({ name: unitName, points: unitPoints });
          }
        }
      });

      if (currentRegiment) listData.regiments.push(currentRegiment);

      const newId = Date.now().toString();
      
      // CORRECTION : On enregistre un objet plat pour que MyListWarscroll le lise facilement
      const newList = {
        id: newId,
        title: listData.customTitle,
        ...listData, // On "étale" les données (regiments, faction, etc.)
        listData: listData // On garde quand même listData pour SavedLists.jsx
      };

      const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
      localStorage.setItem("warhammer_saved_lists", JSON.stringify([newList, ...saved]));

      // Navigation fluide vers le détail
      navigate(`/my-lists/${newId}`);

    } catch (err) {
      console.error(err);
      alert("Erreur import");
    }
  };

  return (
    <div className="container mt-4 pb-5 px-3">
      <div className="card bg-dark border-secondary shadow-lg rounded-4 overflow-hidden">
        <div className="card-header bg-black text-white py-3 text-center border-bottom border-secondary">
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
          <button className="btn btn-info fw-bold w-100 py-3 rounded-pill shadow-sm" onClick={handleImport}>
            🚀 Analyser et Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}