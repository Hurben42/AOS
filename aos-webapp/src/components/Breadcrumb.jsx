import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Breadcrumb({
  factionName,      // On va s'assurer que c'est le slug (ex: stormcast-eternals)
  displayFaction,   // Le nom propre pour l'affichage (ex: Stormcast Eternals)
  warscrollName,
  sectionName,
}) {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const category = pathnames[1]; // Récupère 'order', 'chaos', etc.

  const normalizeText = (text) =>
    text ? text.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "";

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb mb-0">
        <li className="breadcrumb-item">
          <Link to="/" className="text-decoration-none">Home</Link>
        </li>

        {factionName && (
          <li className="breadcrumb-item">
            <Link to={`/category/${category}/faction/${factionName}`} className="text-decoration-none">
              {displayFaction || normalizeText(factionName)}
            </Link>
          </li>
        )}

        {sectionName && (
          <li className="breadcrumb-item">
            <Link to={`/category/${category}/faction/${factionName}/section/${sectionName}`} className="text-decoration-none">
              {normalizeText(sectionName)}
            </Link>
          </li>
        )}

        {warscrollName && (
          <li className="breadcrumb-item active text-white-50" aria-current="page">
            {normalizeText(warscrollName)}
          </li>
        )}
      </ol>
    </nav>
  );
}