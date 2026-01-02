import React from "react";
import { Link, useParams } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";
import Breadcrumb from "../components/Breadcrumb";

export default function Category() {
  const { category } = useParams();
  const categoryKey = category.toLowerCase();
  const factions = Object.keys(warscrollsData[categoryKey] || {});

  const cleanForUrl = (name) => name.toLowerCase().replace(/\s+/g, "").trim();

  return (
    <div className="container mt-4">
      <Breadcrumb category={category} />
      <h2 className="mb-4 text-white">Catégorie – {category}</h2>
      <div className="list-group shadow">
        {factions.map((faction) => (
          <Link
            key={faction}
            to={`/category/${categoryKey}/faction/${cleanForUrl(faction)}`}
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 bg-dark text-white border-secondary"
          >
            <span className="fw-bold text-uppercase">{faction}</span>
            <i className="bi bi-chevron-right text-primary"></i>
          </Link>
        ))}
      </div>
    </div>
  );
}