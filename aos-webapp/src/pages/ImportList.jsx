import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ImportList() {
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const handleImport = () => {
    if (!text.trim()) return;

    try {
      // 1. Nettoyage des lignes (on ignore les tirets et les lignes de version à la fin)
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
        regiments: [],
        points: "0",
        customTitle: "Ma Liste"
      };

      // 2. EXTRACTION DU TITRE (Ligne 1)
      if (filteredLines.length > 0) {
        let title = filteredLines[0];
        // Si War Nexus : on enlève le pseudo "Pseudo - "
        if (title.includes(" - ")) {
          title = title.split(" - ").slice(1).join(" - ");
        }
        // On enlève les points "2000/2000 pts"
        listData.customTitle = title.replace(/\d+\/\d+\s*(pts|points)/gi, "").trim();
      }

      let currentRegiment = null;

      filteredLines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();

        // 3. DÉTECTION FACTION & SOUS-FACTION (Le coeur du problème)
        if (line.includes("|")) {
          const parts = line.split("|").map(p => p.trim());
          
          if (parts.length >= 3) {
            // Format App Officielle: Alliance | Faction | Sous-Faction
            // On vérifie si la première partie est une alliance connue
            const alliances = ["grand alliance chaos", "grand alliance death", "grand alliance destruction", "grand alliance order"];
            if (alliances.includes(parts[0].toLowerCase())) {
              listData.faction = parts[1];
              listData.subFaction = parts[2];
            } else {
              // Sécurité au cas où l'ordre change
              listData.faction = parts[0];
              listData.subFaction = parts[1];
            }
          } else if (parts.length === 2) {
            // Format War Nexus: Faction | Sous-Faction
            listData.faction = parts[0];
            listData.subFaction = parts[1];
          }
        }

        // 4. LORES (Gère "Lore: " et "Lore - ")
        if (lowerLine.includes("spell lore") || lowerLine.includes("manifestation lore") || lowerLine.includes("prayer lore")) {
          const separator = line.includes(":") ? ":" : "-";
          const value = line.split(separator)[1]?.split("(")[0]?.trim();
          
          if (lowerLine.includes("spell lore")) listData.spellLore = value;
          if (lowerLine.includes("manifestation lore")) listData.manifestationLore = value;
          // Si c'est un Prayer Lore, on peut le mettre dans spellLore ou créer une clé
          if (lowerLine.includes("prayer lore")) listData.prayerLore = value; 
        }

        // 5. TERRAIN
        if (lowerLine.includes("faction terrain")) {
          // Souvent le terrain est sur la ligne d'après (App) ou après le ":" (Nexus)
          if (line.includes(":")) {
            listData.factionTerrain = line.split(":")[1].trim();
          } else if (filteredLines[index + 1]) {
            listData.factionTerrain = filteredLines[index + 1];
          }
        }

        // 6. POINTS (Extraction du premier nombre)
        if (lowerLine.includes("points:")) {
          const match = line.match(/(\d+)/);
          if (match) listData.points = match[1];
        }

        // 7. RÉGIMENTS ET UNITÉS
        if (lowerLine.includes("regiment") || lowerLine.includes("general's")) {
          if (currentRegiment) listData.regiments.push(currentRegiment);
          currentRegiment = { hero: null, units: [] };
        }

        // Regex pour capturer "Nom (Points)"
        const unitMatch = line.match(/^(.+?)\s\((\d+)\)$/);
        if (unitMatch) {
          // On nettoie "5x ", "• ", etc.
          const unitName = unitMatch[1].replace(/^[•\d+x\s]+/, "").trim();
          const unitPoints = unitMatch[2];

          if (currentRegiment) {
            if (!currentRegiment.hero) {
              currentRegiment.hero = { name: unitName, points: unitPoints };
            } else {
              currentRegiment.units.push({ name: unitName, points: unitPoints });
            }
          }
        }
      });

      // Push du dernier régiment analysé
      if (currentRegiment) listData.regiments.push(currentRegiment);

      // --- SAUVEGARDE FINALE ---
      const newId = Date.now().toString();
      const newList = {
        id: newId,
        title: listData.customTitle || "Ma Liste",
        name: listData.customTitle || "Ma Liste",
        date: new Date().toLocaleDateString(),
        faction: listData.faction,
        subFaction: listData.subFaction,
        listData: listData // Données complètes pour ListDetail
      };

      const saved = JSON.parse(localStorage.getItem("warhammer_saved_lists") || "[]");
      localStorage.setItem("warhammer_saved_lists", JSON.stringify([newList, ...saved]));

      // Redirection immédiate
      window.location.href = `/my-lists/${newId}`;

    } catch (err) {
      console.error("Erreur critique au parsing:", err);
      alert("Format de liste non reconnu.");
    }
  };

  return (
    <div className="container mt-4 pb-5 px-3">
      <div className="card bg-dark border-secondary shadow-lg rounded-4 overflow-hidden">
        <div className="card-header bg-black text-white py-3 text-center border-bottom border-secondary">
          <h5 className="mb-0 fw-bold text-info">IMPORTATEUR AOS 4.0</h5>
          <small className="text-secondary">App Officielle ou War Nexus</small>
        </div>
        <div className="card-body p-4">
          <textarea
            className="form-control bg-black text-white border-secondary mb-4 shadow-none"
            rows="15"
            style={{ fontSize: '0.85rem', fontFamily: 'monospace', resize: 'none' }}
            placeholder="Collez votre liste ici..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          
          <button 
            className="btn btn-info fw-bold w-100 py-3 rounded-pill shadow-sm text-uppercase"
            onClick={handleImport}
          >
            🚀 Analyser et Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}