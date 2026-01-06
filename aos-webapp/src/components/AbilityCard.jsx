import React from 'react';
import './AbilityCard.css';

const AbilityCard = ({ ability, type }) => {
  // 'ability' est l'objet { name, html, value, range... }
  // 'type' peut être 'spell', 'prayer', 'trait', 'formation', etc.

  return (
    <div className={`ability-card ${type}`}>
      <div className="ability-header">
        <span className="ability-name">{ability.name}</span>
        {/* Affichage des badges si c'est un sort ou une prière */}
        <div className="ability-badges">
          {ability.value && <span className="badge value">CV: {ability.value}</span>}
          {ability.range && <span className="badge range">Range: {ability.range}</span>}
        </div>
      </div>
      
      {/* Injection du HTML nettoyé */}
      <div 
        className="ability-content"
        dangerouslySetInnerHTML={{ __html: ability.html }} 
      />
    </div>
  );
};

export default AbilityCard;