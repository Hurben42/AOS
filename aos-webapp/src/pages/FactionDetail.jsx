import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

// Imports des données
import battleTraitsData from "../data/battle_traits_detailed.json";
import formationsData from "../data/formations_detailed.json";
import enhancementsData from "../data/enhancements_detailed.json";
import loresData from "../data/lores_detailed.json";
import manifestationsData from "../data/manifestations_detailed.json";
import monstrousTraitsData from "../data/monstrous_traits_detailed.json";
import aorData from "../data/armies_of_renown_detailed.json";

const SECTION_CONFIG = {
  "battle-traits": { title: "Battle Traits", data: battleTraitsData },
  "battle-formations": { title: "Battle Formations", data: formationsData },
  "heroic-traits": { title: "Heroic Traits", data: enhancementsData, subKey: "heroic_traits" },
  "monstrous-traits": { title: "Monstrous Traits", data: monstrousTraitsData },
  "artefacts-of-power": { title: "Artefacts of Power", data: enhancementsData, subKey: "artefacts" },
  "spell-lore": { title: "Spell Lore", data: loresData, subKey: "spells" },
  "prayer-lore": { title: "Prayer Lore", data: loresData, subKey: "prayers" },
  "manifestation-lore": { title: "Manifestation Lore", data: manifestationsData, subKey: "factions" },
  "army-of-renown": { title: "Army of Renown", data: aorData }
};

export default function FactionDetail() {
  const { category, faction, sectionSlug } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const section = SECTION_CONFIG[sectionSlug];

  useEffect(() => {
    const parentDiv = document.querySelector('.bg-black.text-light.min-vh-100');
    if (parentDiv) {
      parentDiv.style.backgroundColor = 'transparent';
      parentDiv.classList.remove('bg-black');
    }

    const loadContent = () => {
      setLoading(true);
      try {
        const factionKey = faction.toLowerCase().replace(/-/g, "");
        let rawData = section.data ? section.data[factionKey] : [];

        if (section.subKey && rawData && !Array.isArray(rawData)) {
          rawData = rawData[section.subKey] || [];
        }

        const validItems = (rawData || []).filter(item => {
          const htmlContent = typeof item === 'string' ? item : item?.html;
          if (!htmlContent) return false;
          return htmlContent.replace(/<[^>]*>/g, '').trim().length > 0;
        }).map(item => {
          if (typeof item === 'string') {
            const nameMatch = item.match(/<b>([^<]+)<\/b>/i);
            return {
              name: nameMatch ? nameMatch[1].replace(':', '').trim() : "Règle",
              html: item
            };
          }
          return item;
        });

        setItems(validItems);
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();

    return () => {
      if (parentDiv) {
        parentDiv.style.backgroundColor = '';
        parentDiv.classList.add('bg-black');
      }
    };
  }, [faction, sectionSlug, section]);

  return (
    <div className="container-fluid min-vh-100 p-4">
      <style>{`
        .custom-rule-card {
          background: rgba(20, 20, 20, 0.9);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-left: 5px solid #d4af37;
          margin-bottom: 1.5rem;
        }
        .ability-header {
          display: flex;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 15px;
        }
        .ability-title {
          font-family: 'Cinzel', serif;
          color: #d4af37;
          text-transform: uppercase;
          font-size: 1.1rem;
          margin: 0;
        }
        .badge-value {
          background: #76602b;
          color: white;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 0.8rem;
          height: fit-content;
        }
        .rule-html-content { color: #ddd; font-size: 0.95rem; line-height: 1.6; }
        .rule-html-content b { color: #fff; }
        .rule-html-content .kwb, .rule-html-content .kwbu { color: #f39c12; font-weight: bold; }
        .rule-html-content .abHeader { display: block; font-weight: bold; text-transform: uppercase; color: #FFF; margin-bottom: 5px; font-size: 0.85rem; }
        .rule-html-content table { width: 100%; }
        .rule-html-content .ShowFluff { display: block; font-style: italic; color: #888; margin: 10px 0; font-size: 0.9rem; }
        
        /* Breadcrumb Style */
        .breadcrumb-item + .breadcrumb-item::before { content: "›"; color: rgba(255,255,255,0.3); font-size: 1.2rem; line-height: 1; }
      `}</style>

      {/* BREADCRUMB (Identique à FactionList) */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb bg-dark bg-opacity-50 p-2 px-3 rounded-pill border border-secondary border-opacity-25" style={{ display: 'inline-flex' }}>
          <li className="breadcrumb-item">
            <Link to="/" className="text-info text-decoration-none small text-uppercase fw-bold">Grand Alliances</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/category/${category}`} className="text-info text-decoration-none small text-uppercase fw-bold">{category}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/category/${category}/faction/${faction}`} className="text-info text-decoration-none small text-uppercase fw-bold">{faction.replace(/-/g, ' ')}</Link>
          </li>
          <li className="breadcrumb-item active text-white-50 small text-uppercase fw-bold" aria-current="page">
            {section?.title}
          </li>
        </ol>
      </nav>
    
      <div className="text-center my-5">
        <h1 className="text-white text-uppercase fw-bold" style={{letterSpacing: '5px'}}>{section?.title}</h1>
        <p className="text-info small text-uppercase mt-2">{faction.replace(/-/g, ' ')}</p>
      </div>
      
      {loading ? (
        <div className="text-center my-5"><div className="spinner-border text-warning"></div></div>
      ) : items.length > 0 ? (
        <div className="row justify-content-center">
          {items.map((item, index) => (
            <div key={index} className="col-12 col-xl-10">
              <div className="custom-rule-card p-4 rounded-3 shadow">
                <div className="ability-header">
                  <h3 className="ability-title">{item.name}</h3>
                  <div className="d-flex gap-2">
                    {item.castingValue && <span className="badge-value">CV: {item.castingValue}</span>}
                    {item.range && <span className="badge-value">Range: {item.range}</span>}
                  </div>
                </div>
                <div className="rule-html-content" dangerouslySetInnerHTML={{ __html: item.html }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center my-5 text-muted fst-italic">Aucune donnée disponible.</div>
      )}
    </div>
  );
}