import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";

const SECTION_CONFIG = {
  "battle-traits": { title: "Battle Traits", keywords: ["BATTLE TRAITS", "ALLEGIANCE ABILITIES"] },
  "battle-formations": { title: "Battle Formations", keywords: ["BATTLE FORMATIONS", "TRIBE", "TEMPLE"] },
  "heroic-traits": { title: "Heroic Traits", keywords: ["HEROIC TRAITS", "COMMAND TRAITS"] },
  "monstrous-traits": { title: "Monstrous Traits", keywords: ["MONSTROUS TRAITS"] },
  "artefacts-of-power": { title: "Artefacts of Power", keywords: ["ARTEFACTS OF POWER", "ARTEFACT", "RELICS"] },
  "spell-lore": { title: "Spell Lore", keywords: ["SPELL LORE", "SPELL", "LORE OF"] },
  "prayer-lore": { title: "Prayer Lore", keywords: ["PRAYER LORE", "PRAYER", "SCRIPTURES"] },
  "manifestation-lore": { title: "Manifestation Lore", keywords: ["MANIFESTATION LORE"] }
};

export default function FactionDetail() {
  const { category, faction, sectionSlug } = useParams();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const section = SECTION_CONFIG[sectionSlug];

  useEffect(() => {
    if (!section) return;

    const getPaths = (f) => {
      const slug = f.toLowerCase();
      if (slug.includes("cities of sigmar")) return { folder: "cities of sigmar", file: "citiesofsigmar" };
      if (slug.includes("daughters of khaine")) return { folder: "daughters of khaine", file: "daughtersofkhaine" };
      if (slug.includes("sons of behemat")) return { folder: "sons of behemat", file: "sonsofbehemat" };
      const normal = slug.replace(/\s+/g, "-");
      return { folder: normal, file: normal };
    };

    const paths = getPaths(faction);
    const categoryPath = category.toLowerCase();
    const filePath = `/factions/${categoryPath}/${paths.folder}/${paths.file}.html`;

    setLoading(true);
    fetch(filePath)
      .then((res) => {
        if (!res.ok) throw new Error(`Fichier introuvable.`);
        return res.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        doc.querySelectorAll("img.abLogo, .PitchedBattleProfile, script, style, .NoPrint").forEach(el => el.remove());

        let rawBlocks = [];
        const headers = [...doc.querySelectorAll("h2")];
        
        const header = headers.find(h => 
            h.textContent.trim().replace(/\s+/g, ' ').toUpperCase() === section.title.toUpperCase()
        );

        if (header) {
          let current = header.nextElementSibling;
          while (current && current.tagName !== "H2") {
            if (current.tagName === "H3") {
              rawBlocks.push({ type: 'title', element: current.cloneNode(true) });
            }
            
            const cards = current.querySelectorAll(".BreakInsideAvoid");
            if (cards.length > 0) {
              cards.forEach(card => {
                if (card.querySelector("table") || card.classList.contains("abBody")) {
                  rawBlocks.push({ type: 'card', element: card.cloneNode(true) });
                }
              });
            } else if (current.classList.contains("BreakInsideAvoid")) {
              rawBlocks.push({ type: 'card', element: current.cloneNode(true) });
            }
            current = current.nextElementSibling;
          }
        }

        const finalHtml = [];
        const processedTexts = []; 

        rawBlocks.forEach((item) => {
          // --- NETTOYAGE DES SPANS DANS LES HEADERS DE CAPACITÉS ---
          // On cherche les divs avec la classe abHeader (souvent là où se trouvent les spans gênantes)
          item.element.querySelectorAll(".abHeader, b").forEach(headerPart => {
            const spans = headerPart.querySelectorAll("span");
            if (spans.length > 0) {
              // On remplace le contenu du header par son texte brut (sans les spans)
              headerPart.textContent = headerPart.textContent.trim();
            }
          });

          const cleanText = item.element.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
          
          if (item.type === 'title') {
            if (cleanText.length > 0 && !processedTexts.includes(cleanText)) {
              processedTexts.push(cleanText);
              finalHtml.push(`<div class="lore-title-container"><h3 class="lore-title">${item.element.innerHTML}</h3></div>`);
            }
          } else {
            const isDuplicate = processedTexts.some(existingText => 
              existingText.includes(cleanText) || cleanText.includes(existingText)
            );

            if (cleanText.length > 10 && !isDuplicate) {
              processedTexts.push(cleanText);
              finalHtml.push(`<div class="custom-spell-card">${item.element.outerHTML}</div>`);
            }
          }
        });

        if (finalHtml.length === 0) {
           setError(`Aucune donnée trouvée pour "${section.title}".`);
        } else {
           setContent(finalHtml.join(""));
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [category, faction, sectionSlug, section]);

  return (
    <div className="container mt-4">
      <style>{`
        .lore-title-container { margin-top: 3rem; margin-bottom: 1.5rem; text-align: center; }
        .lore-title { 
            display: inline-block; color: #0dcaf0; text-transform: uppercase; 
            font-weight: 800; letter-spacing: 2px; border-bottom: 2px solid #0dcaf0; 
            padding-bottom: 5px; font-size: 1.5rem; 
        }
        .custom-spell-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1.2rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        /* Style renforcé pour les titres de capacités une fois nettoyés */
        .custom-spell-card .abHeader { 
          color: #ffc107; 
          font-weight: bold; 
          text-transform: uppercase; 
          display: block;
          margin-bottom: 5px;
        }
        .custom-spell-card b { color: #ffc107; text-transform: uppercase; }
        .custom-spell-card hr { border-color: rgba(255,255,255,0.1); margin: 10px 0; }
        .section-content { color: #e0e0e0; line-height: 1.6; }
        .custom-spell-card div:empty { display: none; }
        
        /* Correction pour les tables importées */
        table { width: 100%; color: inherit; }
      `}</style>

      <Breadcrumb categoryName={category} factionName={faction} />
      
      <div className="d-flex justify-content-between align-items-center my-4">
        <Link to={`/category/${category}/faction/${faction}`} className="btn btn-outline-light btn-sm px-3">
          ← Retour
        </Link>
        <h2 className="text-white text-uppercase m-0 fw-bold" style={{letterSpacing: '3px'}}>{section?.title}</h2>
        <div style={{width: '85px'}}></div>
      </div>
      
      {loading ? (
        <div className="text-center my-5"><div className="spinner-border text-info"></div></div>
      ) : error ? (
        <div className="alert alert-warning bg-dark text-white border-warning">{error}</div>
      ) : (
        <div className="section-content animate__animated animate__fadeIn px-2 pb-5" 
             dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </div>
  );
}