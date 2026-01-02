import React, { useState } from "react";
import { Link } from "react-router-dom";
import warscrollsData from "../data/warscrolls.json";

const CATEGORY_BANNERS = {
  chaos: "banner_slaves.webp",
  death: "banner_flesheater.webp",
  destruction: "banner_ironjawz.webp",
  order: "banner_stormcast.webp",
};

const CATEGORY_BUTTON_CLASS = {
  chaos: "btn-secondary",
  death: "btn-primary",
  destruction: "btn-warning",
  order: "btn-info",
};

export default function Home() {
  const [openCategories, setOpenCategories] = useState({});

  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // "Sons of Behemat" -> "sonsofbehemat"
  const cleanForUrl = (name) => name.toLowerCase().replace(/\s+/g, "").trim();

  return (
    <div className="container mt-4">
      <h1 className="mb-4 text-center">Factions</h1>
      {Object.keys(warscrollsData).map((category) => (
        <div key={category} className="mb-4">
          <button
            className={`btn ${CATEGORY_BUTTON_CLASS[category.toLowerCase()] || "btn-secondary"} w-100 text-start p-0 overflow-hidden`}
            onClick={() => toggleCategory(category)}
          >
            {CATEGORY_BANNERS[category.toLowerCase()] && (
              <img src={`/img/${CATEGORY_BANNERS[category.toLowerCase()]}`} className="w-100" style={{ maxHeight: "140px", objectFit: "cover" }} />
            )}
            <div className="p-1 fw-bold text-capitalize text-center">{category}</div>
          </button>

          <div className={`collapse ${openCategories[category] ? "show" : ""}`}>
            <ul className="list-group mt-2">
              {Object.keys(warscrollsData[category]).map((faction) => (
                <Link
                  key={faction}
                  to={`/category/${category.toLowerCase()}/faction/${cleanForUrl(faction)}`}
                  className="list-group-item list-group-item-action"
                >
                  {faction}
                </Link>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}