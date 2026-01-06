const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_DIR = path.join(__dirname, 'public/factions');
const OUTPUT_FILE = path.join(__dirname, 'src/data/enhancements_detailed.json');

const SECTIONS = [
    { name: 'heroic_traits', anchor: 'Heroic-Traits' },
    { name: 'artefacts', anchor: 'Artefacts-of-Power' }
];

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
        results[faction] = { heroic_traits: [], artefacts: [] };

        SECTIONS.forEach(section => {
            const anchor = $(`a[name="${section.anchor}"]`);
            if (anchor.length === 0) return;

            // On définit la zone de recherche : le container Columns2 le plus proche
            const container = anchor.closest('center').find('.Columns2').first().length > 0 
                              ? anchor.closest('center').find('.Columns2').first()
                              : anchor.nextAll('.Columns2').first();

            if (container.length > 0) {
                // On cherche TOUS les types de titres H3 possibles
                container.find('h3').each((i, el) => {
                    const titleEl = $(el);
                    const name = titleEl.text().trim();
                    
                    // On cherche le bloc de règle qui suit ce titre
                    let ruleBlock = titleEl.nextAll('.BreakInsideAvoid').first();
                    
                    // Si pas trouvé en frère direct, on cherche dans le parent (structure complexe)
                    if (ruleBlock.length === 0) {
                        ruleBlock = titleEl.parent().nextAll('.BreakInsideAvoid').first();
                    }

                    // On vérifie que le nom n'est pas vide et qu'on a bien une règle
                    if (name && name.length > 2 && ruleBlock.length > 0) {
                        results[faction][section.name].push({
                            name: name,
                            html: sanitizeHtml($, ruleBlock)
                        });
                    }
                });
            }
        });
        
        console.log(`✅ ${faction.toUpperCase()} : ${results[faction].heroic_traits.length} Traits, ${results[faction].artefacts.length} Artefacts.`);
    });
});

function sanitizeHtml($, element) {
    const clone = element.clone();
    clone.find('span[data-tooltip-content]').each((i, el) => $(el).replaceWith($(el).text()));
    clone.find('img, script, style, a').each((i, el) => {
        if ($(el).is('a')) $(el).replaceWith($(el).text());
        else $(el).remove();
    });
    clone.find('*').each((i, el) => {
        if (!$(el).hasClass('abHeader')) $(el).removeAttr('style');
        $(el).removeAttr('width').removeAttr('background').removeAttr('cellspacing').removeAttr('cellpadding').removeAttr('border');
    });
    return clone.html().trim().replace(/\s+/g, ' ');
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));