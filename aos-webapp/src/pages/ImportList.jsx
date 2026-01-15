import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// IMPORT DES RÉFÉRENTIELS JSON
import battleTacticsData from "../data/battletactics.json";
import enhancementsData from "../data/enhancements_detailed.json";
import spellsIndex from "../data/spellsIndex.json";
import manifestationsIndex from "../data/manifestationsIndex.json";

export default function ImportList() {
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const handleImport = () => {
    if (!text.trim()) return;

    try {
      const rawText = text;
      const lines = text.split("\n").map(l => l.trim());
      
      let listData = {
        faction: "Générique",
        subFaction: "Non définie",
        spellLore: "Non défini",
        manifestationLore: "Non défini",
        battle_tactics: [],
        regiments: [],
        points: "0",
        customTitle: "Ma Liste"
      };

      // --- 1. DÉTECTION FACTION & SUBFACTION (Via le pipe |) ---
      const factionLine = lines.find(l => l.includes("|"));
      if (factionLine) {
        const parts = factionLine.split("|").map(p => p.trim());
        // Format: Grand Alliance | Faction | Subfaction
        if (parts.length >= 3) {
          listData.faction = parts[1];
          listData.subFaction = parts[2];
        } else {
          listData.faction = parts[0];
          listData.subFaction = parts[1];
        }
      }

      // --- 2. DÉTECTION DES BATTLE TACTICS (Scan intégral via JSON) ---
      battleTacticsData.forEach(tactic => {
        const regex = new RegExp(`\\b${tactic.name}\\b`, "i");
        if (regex.test(rawText)) {
          if (!listData.battle_tactics.includes(tactic.name)) {
            listData.battle_tactics.push(tactic.name);
          }
        }
      });

      // --- 3. DÉTECTION DES LORES (Scan intégral via JSON) ---
      // Scan des Spell Lores
      Object.keys(spellsIndex.factions || {}).forEach(fKey => {
        Object.keys(spellsIndex.factions[fKey]).forEach(loreName => {
          if (rawText.toLowerCase().includes(loreName.toLowerCase())) {
            listData.spellLore = loreName;
          }
        });
      });
      // Scan des Manifestations
      Object.keys(manifestationsIndex.generics || {}).forEach(mng => {
        if (rawText.toLowerCase().includes(mng.toLowerCase())) {
          listData.manifestationLore = mng;
        }
      });

      // --- 4. ANALYSE DES RÉGIMENTS & OPTIMISATIONS ---
      let currentRegiment = null;

      lines.forEach((line) => {
        const lowerLine = line.toLowerCase();

        // Points
        const ptsMatch = line.match(/(\d+)\/(\d+)\s*(pts|points)/i);
        if (ptsMatch) listData.points = ptsMatch[1];

        // Nouveau Régiment
        if (lowerLine.includes("regiment") && !lowerLine.includes("battle tactics")) {
          if (currentRegiment) listData.regiments.push(currentRegiment);
          currentRegiment = { hero: null, heroOptions: [], units: [] };
          return;
        }

        // Unités / Héros (avec nettoyage Legion)
        const unitMatch = line.match(/^(.+?)\s\((\d+)\)$/);
        if (unitMatch && currentRegiment) {
          let name = unitMatch[1].replace(/^[•\d+x\s]+/, "").trim();
          if (name.startsWith("Legion of the First Prince ")) {
            name = name.replace("Legion of the First Prince ", "").trim();
          }

          if (!currentRegiment.hero) {
            currentRegiment.hero = name;
          } else {
            currentRegiment.units.push(name);
          }
          return;
        }

        // OPTIMISATIONS (Scan via enhancements_detailed.json)
        // Si la ligne commence par un point, c'est potentiellement un trait ou artefact
        if (line.startsWith("•") && currentRegiment && currentRegiment.hero) {
          const checkText = line.replace("•", "").trim().toUpperCase();
          
          Object.values(enhancementsData).forEach(fData => {
            ["heroic_traits", "artefacts"].forEach(cat => {
              if (fData[cat]) {
                fData[cat].forEach(enh => {
                  if (checkText.includes(enh.name.toUpperCase())) {
                    currentRegiment.heroOptions.push(enh.name);
                  }
                });
              }
            });
          });
        }
      });

      if (currentRegiment) listData.regiments.push(currentRegiment);

      // --- 5. SAUVEGARDE ---
      const newId = Date.now().toString();
      const newList = {
        id: newId,
        title: lines[0]?.split("---")[0]?.trim() || "Ma Liste",
        ...listData,
        listData: listData // Doublon pour compatibilité avec ton ListDetail
      };

      const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
      localStorage.setItem("warhammer_saved_lists", JSON.stringify([newList, ...saved]));
      navigate(`/my-lists/${newId}`);

    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse Database.");
    }
  };

  return (
    <div className="container mt-4 pb-5 font-monospace">
      <div className="card bg-black border-secondary border-opacity-25 shadow-lg">
        <div className="card-header bg-black py-3 text-center border-bottom border-secondary border-opacity-25">
          <h5 className="mb-0 fw-bold text-info text-uppercase">Data-Scanner Intégral</h5>
        </div>
        <div className="card-body p-4">
          <textarea
            className="form-control bg-black text-white border-secondary border-opacity-25 mb-4 shadow-none"
            rows="14"
            placeholder="Collez votre export ici..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <button className="btn btn-info fw-bold w-100 py-3 rounded-0 text-uppercase" onClick={handleImport}>
            <i className="bi bi-database-fill-check me-2"></i> Lancer l'analyse croisée
          </button>
        </div>
      </div>
    </div>
  );
}