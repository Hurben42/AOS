import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";

const SECTION_CONFIG = {
  "battle-traits": {
    title: "Battle Traits",
    keywords: ["BATTLE TRAITS", "ALLEGIANCE ABILITIES", "BATTLE TRAIT"],
  },
  "battle-formations": {
    title: "Battle Formations",
    keywords: ["BATTLE FORMATIONS", "BATTLE FORMATION", "TRIBE", "TEMPLE", "CITY"],
  },
  "heroic-traits": {
    title: "Heroic Traits",
    keywords: ["HEROIC TRAITS", "HEROIC TRAIT", "COMMAND TRAITS"],
  },
  "artefacts-of-power": {
    title: "Artefacts of Power",
    keywords: ["ARTEFACTS OF POWER", "ARTEFACT", "TREASURES", "RELICS"],
  },
  "spell-lore": {
    title: "Spell Lore",
    keywords: ["SPELL LORE", "SPELL", "LORE OF"],
  },
  "prayer-lore": {
    title: "Prayer Lore",
    keywords: ["PRAYER LORE", "PRAYER", "SCRIPTURES"],
  },
};

export default function FactionDetail() {
  const { category, faction, sectionSlug } = useParams();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const section = SECTION_CONFIG[sectionSlug];

  useEffect(() => {
    if (!section) return;

    // --- GESTION DES CHEMINS ---
    const getPaths = (f) => {
      const slug = f.toLowerCase();
      // Cas particuliers basés sur vos fichiers fournis
      if (slug.includes("cities of sigmar")) {
        return { folder: "cities of sigmar", file: "citiesofsigmar" };
      }
      if (slug.includes("daughters of khaine")) {
        return { folder: "daughters of khaine", file: "daughtersofkhaine" };
      }
      if (slug.includes("sons of behemat")) {
        return { folder: "sons of behemat", file: "sonsofbehemat" };
      }
      // Cas par défaut (ex: skaven)
      const normal = slug.replace(/\s+/g, "-");
      return { folder: normal, file: normal };
    };

    const paths = getPaths(faction);
    const categoryPath = category.toLowerCase();
    
    // Construction du chemin : /factions/order/cities of sigmar/citiesofsigmar.html
    const filePath = `/factions/${categoryPath}/${paths.folder}/${paths.file}.html`;

    setLoading(true);
    setError(null);

    fetch(filePath)
      .then((res) => {
        if (!res.ok) throw new Error(`Fichier introuvable : ${filePath}`);
        return res.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Nettoyage des scripts et logos
        doc.querySelectorAll("img.abLogo, .PitchedBattleProfile, script, style").forEach(el => el.remove());

        let blocks = [];

        /* 1. Méthode Titre H2 */
        const headers = [...doc.querySelectorAll("h2")];
        const header = headers.find(h => 
          h.textContent.trim().toUpperCase() === section.title.toUpperCase()
        );

        if (header) {
          let current = header.nextElementSibling;
          while (current && current.tagName !== "H2") {
            const found = current.querySelectorAll(".BreakInsideAvoid");
            if (found.length > 0) {
              blocks = [...found];
              break;
            }
            current = current.nextElementSibling;
          }
        }

        /* 2. Méthode Scan de secours (Deep Scan) */
        if (blocks.length === 0) {
          const allPotential = [...doc.querySelectorAll(".BreakInsideAvoid")];
          blocks = allPotential.filter(b => {
            const text = b.textContent.toUpperCase();
            return section.keywords.some(kw => text.includes(kw));
          });
        }

        /* 3. Méthode Tables */
        if (blocks.length === 0) {
          doc.querySelectorAll("table").forEach(table => {
            if (section.keywords.some(kw => table.textContent.toUpperCase().includes(kw))) {
              blocks.push(table);
            }
          });
        }

        // Déduplication
        const seen = new Set();
        const finalHtml = [];

        blocks.forEach((b) => {
          const textKey = b.textContent.trim().substring(0, 100);
          if (!seen.has(textKey) && b.textContent.trim().length > 10) {
            seen.add(textKey);
            finalHtml.push(b.outerHTML);
          }
        });

        if (finalHtml.length === 0) throw new Error("Aucune donnée trouvée dans le fichier.");

        setContent(finalHtml.join("<hr class='my-4' />"));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [category, faction, sectionSlug, section]);

  return (
    <div className="container mt-4">
    <Breadcrumb 
        categoryName={category} 
        factionName={faction} 
        sectionName={section?.title} 
    />
      <Link to={`/category/${category}/faction/${faction}`} className="btn btn-secondary my-3">
        ← Retour
      </Link>
      <h2 className="text-center mb-4">{section?.title}</h2>
      
      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Chargement des données de faction...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger shadow-sm">
          <h5>Erreur de chargement</h5>
          <p>{error}</p>
          <hr />
          <small>
            Structure attendue : <br />
            <code>/factions/{category.toLowerCase()}/[Nom du Dossier]/[NomFichier].html</code>
          </small>
        </div>
      )}

      {!loading && !error && (
        <div className="section-content animate__animated animate__fadeIn" dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </div>
  );
}