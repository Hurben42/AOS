const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_DIR = path.join(__dirname, 'public/factions');
const OUTPUT_FILE = path.join(__dirname, 'src/data/formations_detailed.json');

const results = {};
const alliances = ['order', 'chaos', 'death', 'destruction'];

console.log("🛡️ Extraction précise des Battle Formations...");

alliances.forEach(alliance => {
    const alliancePath = path.join(BASE_DIR, alliance);
    if (!fs.existsSync(alliancePath)) return;

    const factions = fs.readdirSync(alliancePath);
    factions.forEach(faction => {
        const htmlPath = path.join(alliancePath, faction, `${faction}.html`);
        if (!fs.existsSync(htmlPath)) return;

        const html = fs.readFileSync(htmlPath, 'utf8');
        const $ = cheerio.load(html);
        results[faction] = [];

        // 1. On cherche le H2 "Battle Formations"
        const sectionHeader = $('h2.outline_header3').filter((i, el) => {
            return $(el).text().trim().toLowerCase() === "battle formations";
        });

        if (sectionHeader.length > 0) {
            // 2. On cible le container .Columns2 qui est juste après
            const columnsContainer = sectionHeader.nextAll('.Columns2').first();

            if (columnsContainer.length > 0) {
                // 3. Chaque formation a un titre h3.h2_pge
                columnsContainer.find('h3.h2_pge').each((i, el) => {
                    const titleEl = $(el);
                    const formationName = titleEl.text().trim();

                    // 4. On récupère le bloc de règle (BreakInsideAvoid) qui suit ce titre précis
                    const ruleBlock = titleEl.nextAll('.BreakInsideAvoid').first();

                    if (formationName && ruleBlock.length > 0) {
                        results[faction].push({
                            name: formationName,
                            html: sanitizeFormationHtml($, ruleBlock)
                        });
                    }
                });
            }
        }
        console.log(`✅ ${faction.toUpperCase()} : ${results[faction].length} formations trouvées.`);
    });
});

// Nettoyage spécifique pour garder un visuel propre dans React
function sanitizeFormationHtml($, element) {
    const clone = element.clone();

    // Supprimer les tooltips complexes mais garder le texte (ex: non-SQUIG MOONCLAN)
    clone.find('span[data-tooltip-content]').each((i, el) => {
        $(el).replaceWith($(el).text());
    });

    // Supprimer les logos et images locales (abOffensive.png, etc.)
    clone.find('img, .abLogo').remove();

    // Supprimer les liens Wahapedia (a name=...)
    clone.find('a').each((i, el) => {
        $(el).replaceWith($(el).text());
    });

    // Nettoyage des attributs de style pour laisser le CSS de l'app gérer l'affichage
    clone.find('*').each((i, el) => {
        const tag = el.tagName.toLowerCase();
        // On ne garde QUE la couleur de fond du header pour l'identité visuelle si besoin
        if (!$(el).hasClass('abHeader')) {
            $(el).removeAttr('style');
        }
        $(el).removeAttr('width').removeAttr('background').removeAttr('cellspacing').removeAttr('cellpadding').removeAttr('border');
    });

    return clone.html().trim().replace(/\s+/g, ' ');
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
console.log(`\n🚀 Terminé ! ${OUTPUT_FILE} est à jour.`);