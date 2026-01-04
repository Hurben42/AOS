import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";

export default function MyListWarscroll() {
  const { id, unitSlug } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    // 1. Normalisation du slug venant de l'URL de la liste
    let target = unitSlug.toLowerCase().replace(/-/g, "").replace(/[^a-z0-9]/g, "");
    
    // Cas spécifique : mapping pour les unités dont le nom a changé entre les versions d'app
    if (target === "ratlingguns") target = "ratlingwarpblaster";

    // 2. Recherche du Warscroll dans toute la base de données JSON
    let foundWs = null;
    let foundCat = "";
    let foundFaction = "";

    // On parcourt les Alliances (Chaos, Order, etc.)
    for (const [catName, factions] of Object.entries(warscrollsData)) {
      // On parcourt les Factions (Skaven, Stormcast, etc.)
      for (const [factionName, units] of Object.entries(factions)) {
        const match = units.find(ws => {
          const jsonSlug = (ws.searchSlug || ws.slug || "").replace(/[^a-z0-9]/g, "");
          return jsonSlug === target || jsonSlug.includes(target);
        });

        if (match) {
          foundWs = match;
          foundCat = catName;
          foundFaction = factionName;
          break;
        }
      }
      if (foundWs) break;
    }

    // 3. Redirection vers le détail officiel si trouvé
    if (foundWs) {
      // Formatage de l'URL officielle : /category/:category/faction/:faction/warscroll/:slug
      const factionSlug = foundFaction.toLowerCase().replace(/\s+/g, "-");
      const officialUrl = `/category/${foundCat.toLowerCase()}/faction/${factionSlug}/warscroll/${foundWs.slug}`;
      
      // replace: true évite que l'utilisateur ne revienne sur cette page de chargement en faisant "Précédent"
      navigate(officialUrl, { replace: true });
    } else {
      setError(true);
    }
  }, [id, unitSlug, navigate]);

  if (error) {
    return (
      <div className="container mt-5 text-center text-white">
        <div className="card bg-dark border-danger p-4 blur-bg">
          <h4 className="text-danger">Warscroll introuvable</h4>
          <p className="text-white-50">Le nom "{unitSlug}" n'a pu être associé à aucune unité officielle dans la base de données.</p>
          <Link to={`/my-lists/${id}`} className="btn btn-outline-light mt-3">Retour à la liste</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 text-center text-white">
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Recherche...</span>
      </div>
      <p className="mt-3 text-secondary text-uppercase fw-bold" style={{ letterSpacing: '2px' }}>
        Analyse de l'unité et redirection...
      </p>
    </div>
  );
}