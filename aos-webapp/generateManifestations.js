const fs = require('fs');
// Charge ton fichier de données
const warscrolls = require('./src/data/warscrolls.json');

const manifestationsIndex = {
  // Les génériques restent fixes car ils ne sont pas dans les dossiers de faction
  generics: {
    "Primal Energy": ["Burning Head", "Icy Shackles", "Emerald Lifeswarm", "Ravenak's Gnashing Jaws"],
    "Morbid Conjuration": ["Purple Sun of Shyish", "Suffocating Gravetide", "Lauchon the Soulseeker", "Soulsnare Shackles"],
    "Aetherwrought Machineries": ["Chronomantic Cogs", "Quicksilver Swords", "Umbral Spellportal"],
    "Twilit Sorceries": ["Geminids of Uhl-Gysh", "Malevolent Maelstrom", "Prismatic Palisade"],
    "Forbidden Power": ["Horrorghast", "Lauchon the Soulseeker", "Shards of Valagharr", "Soulsnare Shackles"],
    "Krondspine": ["Krondspine Incarnate of Ghur"]
  },
  factions: {}
};

console.log("Extraction automatique des manifestations par faction...");

Object.values(warscrolls).forEach(grandAlliance => {
  Object.entries(grandAlliance).forEach(([factionName, units]) => {
    if (Array.isArray(units)) {
      // On filtre les unités qui ont STRICTEMENT le mot-clé MANIFESTATION dans la balise keyword
      const found = units.filter(u => {
        if (!u.html) return false;
        // On cherche la présence du mot-clé dans la structure HTML spécifique aux keywords
        const hasKeyword = u.html.includes('wsKeywordLine1') && u.html.toUpperCase().includes('MANIFESTATION');
        // On exclut les unités qui sont aussi des HERO (pour éviter les sorciers)
        const isHero = u.html.toUpperCase().includes('HERO');
        return hasKeyword && !isHero;
      }).map(u => u.name);

      if (found.length > 0) {
        manifestationsIndex.factions[factionName] = found;
        console.log(`✅ ${factionName} : ${found.length} manifestations trouvées.`);
      }
    }
  });
});

fs.writeFileSync('./src/data/manifestationsIndex.json', JSON.stringify(manifestationsIndex, null, 2));
console.log("✨ Fichier généré : src/data/manifestationsIndex.json");