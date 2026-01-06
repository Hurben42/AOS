const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_DIR = path.join(__dirname, 'public/factions');
const OUTPUT_FILE = path.join(__dirname, 'src/data/lores_detailed.json');

const LORE_SECTIONS = {
    "SPELL LORE": "spells",
    "PRAYER LORE": "prayers"
};

const results = {};
const alliances = ['order', 'chaos', 'death', 'destruction'];

alliances.forEach(alliance => {
    const alliancePath = path.join(BASE_DIR, alliance);
    if (!fs.existsSync(alliancePath)) return;

    const factions = fs.readdirSync(alliancePath);
    factions.forEach(faction => {
        const htmlPath = path.join(alliancePath, faction, `${faction}.html`);
        if (!fs.existsSync(htmlPath)) return;

        const html = fs.readFileSync(htmlPath, 'utf8');
        const $ = cheerio.load(html);
        results[faction] = { spells: [], prayers: [] };

        $('h2').each((i, el) => {
            const headerText = $(el).text().trim().toUpperCase();
            const sectionKey = LORE_SECTIONS[headerText];

            if (sectionKey) {
                let current = $(el).next();
                while (current.length > 0 && current[0].tagName !== 'h2') {
                    const cards = current.hasClass('BreakInsideAvoid') ? current : current.find('.BreakInsideAvoid');
                    
                    cards.each((j, cardEl) => {
                        const card = $(cardEl);
                        
                        // 1. Extraction du Titre
                        const title = card.find('b').first().text().replace(':', '').trim();

                        // 2. Extraction de la Valeur (Casting/Prayer) dans la bulle HTML
                        // On cherche le chiffre dans la div spécifique (.abSpellPointsN ou .abPrayerPointsN)
                        let value = card.find('.abSpellPointsN, .abPrayerPointsN').text().trim();
                        
                        // Backup au cas où (recherche par texte si la bulle n'existe pas)
                        if (!value) {
                            const valueMatch = card.text().match(/(?:Casting|Prayer|Value)\s+(?:of\s+)?(\d+)/i);
                            value = valueMatch ? valueMatch[1] : null;
                        }

                        // 3. Extraction de la Portée (Range)
                        // On cherche le chiffre suivi de " dans le texte
                        const rangeMatch = card.text().match(/(\d+(?:"|”|'| inch))/i);
                        let range = rangeMatch ? rangeMatch[1] : "Variable";

                        if (title) {
                            results[faction][sectionKey].push({
                                name: title,
                                value: value,
                                range: range,
                                html: sanitizeLoreHtml($, card)
                            });
                        }
                    });
                    current = current.next();
                }
            }
        });
        console.log(`✨ ${faction.toUpperCase()} : Lores extraits.`);
    });
});

function sanitizeLoreHtml($, element) {
    const clone = element.clone();
    clone.find('span[data-tooltip-content]').each((i, el) => $(el).replaceWith($(el).text()));
    clone.find('img, script, style').remove();
    clone.find('*').removeAttr('style').removeAttr('width').removeAttr('background').removeAttr('cellspacing').removeAttr('cellpadding').removeAttr('border');
    return clone.html().trim().replace(/\s+/g, ' ');
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));