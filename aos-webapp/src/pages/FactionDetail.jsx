import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const SECTION_CONFIG = {
  "battle-traits": { title: "Battle Traits" },
  "battle-formations": { title: "Battle Formations" },
  "heroic-traits": { title: "Heroic Traits" },
  "monstrous-traits": { title: "Monstrous Traits" },
  "artefacts-of-power": { title: "Artefacts of Power" },
  "spell-lore": { title: "Spell Lore" },
  "prayer-lore": { title: "Prayer Lore" },
  "manifestation-lore": { title: "Manifestation Lore" }
};

export default function FactionDetail() {
  const { category, faction, sectionSlug } = useParams();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const section = SECTION_CONFIG[sectionSlug];

  // Gestion de la transparence du fond parent
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

    // Helper pour matcher la structure de tes dossiers
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
        if (!res.ok) throw new Error(`Fichier HTML introuvable pour cette faction.`);
        return res.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // Nettoyage immédiat des éléments parasites
        doc.querySelectorAll("img.abLogo, .PitchedBattleProfile, script, style, .NoPrint").forEach(el => el.remove());

        let finalHtml = [];
        const headers = [...doc.querySelectorAll("h2")];
        
        // On cible le bon H2
        const header = headers.find(h => 
            h.textContent.trim().toUpperCase() === section.title.toUpperCase()
        );

        if (header) {
          let current = header.nextElementSibling;
          
          // --- LOGIQUE DE COLLECTE : TOUT JUSQU'AU PROCHAIN H2 ---
          while (current && current.tagName !== "H2") {
            
            // 1. Titres de sous-sections (ex: noms des formations)
            if (current.tagName === "H3") {
              finalHtml.push(`<div class="lore-title-container"><h3 class="lore-title">${current.innerHTML}</h3></div>`);
            }
            
            // 2. Cartes de règles (Format standard Warscrolls)
            const cards = current.classList.contains("BreakInsideAvoid") 
                          ? [current] 
                          : current.querySelectorAll(".BreakInsideAvoid");

            if (cards.length > 0) {
              cards.forEach(card => {
                if (card.textContent.trim().length > 5) {
                  // Nettoyage interne de la carte (spans inutiles)
                  card.querySelectorAll("span").forEach(span => {
                    if(!span.classList.length) span.replaceWith(span.textContent);
                  });
                  finalHtml.push(`<div class="custom-rule-card">${card.outerHTML}</div>`);
                }
              });
            } 
            // 3. Paragraphes de texte descriptif
            else if (current.tagName === "P" && current.textContent.trim().length > 5) {
               finalHtml.push(`<p class="text-description">${current.innerHTML}</p>`);
            }
            // 4. Listes d'aptitudes
            else if (current.tagName === "UL" || current.tagName === "OL") {
               finalHtml.push(`<div class="text-description">${current.outerHTML}</div>`);
            }

            current = current.nextElementSibling;
          }
        }

        if (finalHtml.length === 0) {
           setError(`Aucune information trouvée dans la section "${section.title}".`);
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
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.95)), url("${backgroundImagePath}")`,
          backgroundSize: 'cover', 
          backgroundPosition: 'center top', 
          backgroundAttachment: 'fixed', 
          zIndex: '-1'
        }}
      ></div>

      <div className="container mt-4 pb-5 position-relative" style={{ zIndex: 1 }}>
        <style>{`
          .lore-title-container { margin-top: 3.5rem; margin-bottom: 2rem; text-align: center; }
          .lore-title { 
              display: inline-block; color: #0dcaf0; text-transform: uppercase; 
              font-weight: 800; letter-spacing: 3px; border-bottom: 3px solid #0dcaf0; 
              padding-bottom: 8px; font-size: 1.6rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          }
          .custom-rule-card {
            background: rgba(20, 20, 20, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid #ffc107;
            border-radius: 4px 12px 12px 4px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            color: #efefef;
          }
          .custom-rule-card .abHeader, .custom-rule-card b { 
            color: #ffc107 !important; 
            text-transform: uppercase; 
            font-size: 1.1rem;
            letter-spacing: 1px;
          }
          .text-description {
            color: #bbb;
            font-style: italic;
            padding: 0 1rem;
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
          .custom-rule-card table { width: 100%; margin-top: 10px; }
          .custom-rule-card td { padding: 5px; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .custom-rule-card hr { border-color: rgba(255,255,255,0.2); }
        `}</style>

        <Link to={`/category/${category}/faction/${faction}`} className="btn btn-outline-warning btn-sm px-4 mb-4 bg-black bg-opacity-50 rounded-pill">
          ← Retour à la faction
        </Link>
      
        <div className="text-center my-5">
          <h1 className="text-white text-uppercase m-0 fw-black" style={{letterSpacing: '5px', textShadow: '0 0 20px rgba(13, 202, 240, 0.5)'}}>{section?.title}</h1>
          <div className="bg-info mx-auto mt-2" style={{height: '2px', width: '50px'}}></div>
          <p className="text-info small text-uppercase mt-3 fw-bold" style={{letterSpacing: '2px'}}>{faction.replace(/-/g, ' ')}</p>
        </div>
        
        {loading ? (
          <div className="text-center my-5"><div className="spinner-border text-info" style={{width: '3rem', height: '3rem'}}></div><p className="mt-3 text-info">Invoquation des archives...</p></div>
        ) : error ? (
          <div className="alert alert-danger bg-dark text-white border-danger mx-auto" style={{maxWidth: '600px'}}>
            <h5 className="text-danger">Oups...</h5>
            {error}
          </div>
        ) : (
          <div className="section-content animate__animated animate__fadeInUp" 
               dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </div>
  );
}