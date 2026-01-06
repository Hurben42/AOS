const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const INPUT_FILE = path.join(__dirname, 'src/data/factions_full_data.json');
const OUTPUT_FILE = path.join(__dirname, 'src/data/manifestations_detailed.json');

// On garde ta structure de base pour les génériques
const manifestationsIndex = {
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

if (!fs.existsSync(INPUT_FILE)) {
    console.error("❌ Fichier factions_full_data.json introuvable !");
    process.exit(1);
}

const fullData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

console.log("🌀 Extraction des Manifestations depuis le JSON...");

Object.keys(fullData).forEach(faction => {
    const manifestHtmlList = fullData[faction].manifestations || [];
    const factionResults = [];

    manifestHtmlList.forEach(html => {
        const $ = cheerio.load(html);
        
        // 1. On cherche si c'est une capacité d'invocation (Keyword SUMMON)
        const isSummon = $('.abKeywordsBodyText').text().includes('SUMMON');
        
        if (isSummon) {
            // 2. Extraction du nom (souvent "SUMMON [NOM]")
            // On cherche le texte en gras après "SUMMON" ou simplement le premier <b>
            let name = '';
            const boldText = $('b').first().text();
            if (boldText.toUpperCase().includes('SUMMON')) {
                name = boldText.replace(/SUMMON/i, '').replace(':', '').trim();
            } else {
                name = boldText.replace(':', '').trim();
            }

            // 3. Extraction de la Casting Value
            const cv = $('.abSpellPointsN').text().trim();

            if (name && cv) {
                factionResults.push({
                    name: name,
                    castingValue: cv,
                    html: sanitizeManifestation(html) // On garde le HTML propre au cas où
                });
            }
        }
    });

    if (factionResults.length > 0) {
        manifestationsIndex.factions[faction] = factionResults;
        console.log(`   ✅ ${faction.toUpperCase()} : ${factionResults.length} manifestations trouvées.`);
    }
});

function sanitizeManifestation(html) {
    const $ = cheerio.load(html);
    $('.ShowFluff, .legend4, img, script, style').remove();
    $('*').removeAttr('style').removeAttr('background').removeAttr('width');
    $('span[data-tooltip-content]').each((i, el) => $(el).replaceWith($(el).text()));
    return $('body').html().trim().replace(/\s+/g, ' ');
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifestationsIndex, null, 2));
console.log(`\n🚀 Terminé ! Index généré dans : ${OUTPUT_FILE}`);