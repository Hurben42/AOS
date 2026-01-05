import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

const SECTION_CONFIG = {
  "battle-traits": { title: "Battle Traits", keywords: ["BATTLE TRAIT"] },
  "battle-formations": { title: "Battle Formations", keywords: ["FORMATION", "TRIBE", "TEMPLE"] },
  "heroic-traits": { title: "Heroic Traits", keywords: ["HEROIC TRAIT", "COMMAND TRAIT"] },
  "monstrous-traits": { title: "Monstrous Traits", keywords: ["MONSTROUS"] },
  "artefacts-of-power": { title: "Artefacts of Power", keywords: ["ARTEFACT", "RELIC"] },
  "spell-lore": { title: "Spell Lore", keywords: ["SPELL", "SORT", "LORE OF"] },
  "prayer-lore": { title: "Prayer Lore", keywords: ["PRAYER", "PRIÈRE", "SCRIPTURES"] },
  "manifestation-lore": { title: "Manifestation Lore", keywords: ["MANIFESTATION"] }
};

export default function FactionDetail() {
  const { category, faction, sectionSlug } = useParams();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const section = SECTION_CONFIG[sectionSlug];

  // --- EFFET POUR LE BACKGROUND ET LA TRANSPARENCE ---
  useEffect(() => {
    const parentDiv = document.querySelector('.bg-black.text-light.min-vh-100');
    if (parentDiv) {
      parentDiv.style.backgroundColor = 'transparent';
      parentDiv.classList.remove('bg-black');
    }
    return () => {
      if (parentDiv) {
        parentDiv.style.backgroundColor = '';
        parentDiv.classList.add('bg-black');
      }
    };
  }, []);

  const imageFileName = faction.toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
  const backgroundImagePath = `/img/banner_${imageFileName}.webp`;

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
                rawBlocks.push({ type: 'card', element: card.cloneNode(true) });
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
          // Nettoyage des spans
          item.element.querySelectorAll(".abHeader, b").forEach(headerPart => {
            const spans = headerPart.querySelectorAll("span");
            if (spans.length > 0) headerPart.textContent = headerPart.textContent.trim();
          });

          const contentText = item.element.textContent.toUpperCase();
          const cleanText = item.element.textContent.replace(/\s+/g, " ").trim().toLowerCase();
          
          if (item.type === 'title') {
            if (cleanText.length > 0 && !processedTexts.includes(cleanText)) {
              processedTexts.push(cleanText);
              finalHtml.push(`<div class="lore-title-container"><h3 class="lore-title">${item.element.innerHTML}</h3></div>`);
            }
          } else {
            // --- FILTRAGE STRICT PAR MOTS-CLÉS ---
            // On vérifie si la carte contient au moins un des mots-clés de la section
            const matchesSection = section.keywords.some(kw => contentText.includes(kw));
            
            // Sécurité spécifique pour les sorts/prières pour ne pas mélanger les deux
            let isWrongType = false;
            if (sectionSlug === "spell-lore" && (contentText.includes("PRAYER") || contentText.includes("PRIÈRE"))) isWrongType = true;
            if (sectionSlug === "prayer-lore" && (contentText.includes("SPELL") || contentText.includes("SORT"))) isWrongType = true;

            const isDuplicate = processedTexts.some(existingText => 
              existingText.includes(cleanText) || cleanText.includes(existingText)
            );

            if (matchesSection && !isWrongType && cleanText.length > 10 && !isDuplicate) {
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
    <div className="position-relative min-vh-100">
      {/* BACKGROUND IMAGE FIXE */}
      <div 
        className="fixed-top w-100 h-100" 
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9)), url("${backgroundImagePath}")`,
          backgroundSize: 'cover', 
          backgroundPosition: 'center top', 
          backgroundAttachment: 'fixed', 
          zIndex: '-1'
        }}
      ></div>

      <div className="container mt-4 pb-5 position-relative" style={{ zIndex: 1 }}>
        <style>{`
          .lore-title-container { margin-top: 3rem; margin-bottom: 1.5rem; text-align: center; }
          .lore-title { 
              display: inline-block; color: #0dcaf0; text-transform: uppercase; 
              font-weight: 800; letter-spacing: 2px; border-bottom: 2px solid #0dcaf0; 
              padding-bottom: 5px; font-size: 1.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          }
          .custom-spell-card {
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1.2rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          }
          .custom-spell-card .abHeader { color: #ffc107; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 5px; }
          .custom-spell-card b { color: #ffc107; text-transform: uppercase; }
          .custom-spell-card hr { border-color: rgba(255,255,255,0.1); margin: 10px 0; }
          .section-content { color: #e0e0e0; line-height: 1.6; }
          table { width: 100%; color: inherit; border-collapse: collapse; }
          td { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        `}</style>

        <Link to={`/category/${category}/faction/${faction}`} className="btn btn-outline-light btn-sm px-3 mb-4 bg-dark bg-opacity-50">
          ← Retour
        </Link>
      
        <div className="text-center my-4">
          <h2 className="text-white text-uppercase m-0 fw-bold" style={{letterSpacing: '3px', textShadow: '2px 2px 10px rgba(0,0,0,0.8)'}}>{section?.title}</h2>
          <p className="text-info small text-uppercase mt-2">{faction.replace(/-/g, ' ')}</p>
        </div>
        
        {loading ? (
          <div className="text-center my-5"><div className="spinner-border text-info"></div></div>
        ) : error ? (
          <div className="alert alert-warning bg-dark text-white border-warning">{error}</div>
        ) : (
          <div className="section-content animate__animated animate__fadeIn" 
               dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </div>
  );
}