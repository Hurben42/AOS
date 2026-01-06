const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_DIR = path.join(__dirname, 'public/factions');
const OUTPUT_DIR = path.join(__dirname, 'src/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'factions_full_data.json');

const SECTIONS = {
    "BATTLE TRAITS": "battle_traits",
    "BATTLE FORMATIONS": "battle_formations",
    "HEROIC TRAITS": "heroic_traits",
    "ARTEFACTS OF POWER": "artefacts",
    "MONSTROUS TRAITS": "monstrous_traits",
    "SPELL LORE": "spells",
    "PRAYER LORE": "prayers",
    "MANIFESTATION LORE": "manifestations"
};

// Fonction de nettoyage en profondeur
function sanitizeHtml($, element) {
    const clone = element.clone();

    // 1. Supprimer les tooltips et garder uniquement le texte
    clone.find('span[data-tooltip-content]').each((i, el) => {
        $(el).replaceWith($(el).text());
    });

    // 2. Supprimer les images et backgrounds
    clone.find('img, td[background]').each((i, el) => {
        if ($(el).is('img')) $(el).remove();
        if ($(el).is('td')) $(el).removeAttr('background');
    });

    // 3. Nettoyer les styles mais garder les classes utiles (kwb pour les mots-clés)
    clone.find('*').each((i, el) => {
        const $el = $(el);
        if (!$el.hasClass('kwb') && !$el.hasClass('kwb2') && !$el.hasClass('abHeader')) {
            $el.removeAttr('style');
        }
        $el.removeAttr('width').removeAttr('cellspacing').removeAttr('cellpadding').removeAttr('border');
    });

    return clone.html().trim()
        .replace(/\s+/g, ' ')
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>');
}

const results = {};
const alliances = ['order', 'chaos', 'death', 'destruction'];

alliances.forEach(alliance => {
    const alliancePath = path.join(BASE_DIR, alliance);
    if (!fs.existsSync(alliancePath)) return;

    const factions = fs.readdirSync(alliancePath);
    factions.forEach(faction => {
        const factionFolderPath = path.join(alliancePath, faction);
        if (!fs.lstatSync(factionFolderPath).isDirectory()) return;

        const htmlPath = path.join(factionFolderPath, `${faction}.html`);
        if (!fs.existsSync(htmlPath)) return;

        const html = fs.readFileSync(htmlPath, 'utf8');
        const $ = cheerio.load(html);
        
        $('script, style, .NoPrint, .PitchedBattleProfile').remove();

        results[faction] = {
            armies_of_renown: [] // Initialisation de la clé Army of Renown
        };

        // --- TRAITEMENT DES SECTIONS STANDARDS ---
        const headers = $('h2');
        headers.each((i, headerEl) => {
            const header = $(headerEl);
            const sectionKey = SECTIONS[header.text().trim().toUpperCase()];

            if (sectionKey) {
                const sectionData = [];
                const seenSignatures = new Set();
                let current = header.next();

                while (current.length > 0 && current[0].tagName !== 'h2') {
                    const cards = current.hasClass('BreakInsideAvoid') ? current : current.find('.BreakInsideAvoid');
                    
                    cards.each((j, cardEl) => {
                        const cleanHtml = sanitizeHtml($, $(cardEl));
                        const signature = cleanHtml.replace(/<[^>]*>/g, '').toLowerCase().replace(/\s+/g, '');
                        if (signature.length > 10 && !seenSignatures.has(signature)) {
                            seenSignatures.add(signature);
                            sectionData.push(cleanHtml);
                        }
                    });

                    if (current[0].tagName === 'h3' && !current.hasClass('h2_pge')) {
                        sectionData.push(`<h3 class="inner-title">${$(current).text().trim()}</h3>`);
                    }
                    current = current.next();
                }
                results[faction][sectionKey] = sectionData;
            }
        });

        // --- TRAITEMENT SPECIFIQUE : ARMY OF RENOWN ---
        // 1. Repérer le point d'entrée
        const aorSectionMarker = $('.h2_ArmyOfRenown');
        
        if (aorSectionMarker.length > 0) {
            // On cherche les H2 qui suivent ce marqueur et qui sont des titres d'armées
            aorSectionMarker.nextAll('h2.outline_header').each((i, aorHeaderEl) => {
                const aorHeader = $(aorHeaderEl);
                
                // 2. Nom de l'armée (King Brodd’s Stomp, etc.)
                const armyName = aorHeader.text().trim();
                
                const armyObject = {
                    name: armyName,
                    description: "",
                    battle_traits: [],
                    enhancements: []
                };

                // 3. Description (Le premier div.Columns2 juste après le titre H2)
                const descDiv = aorHeader.nextAll('.Columns2').first();
                armyObject.description = descDiv.text().trim();

                // 4. Battle Traits (Div Columns2 après l'ancre Battle-Traits-2)
                const btAnchor = aorHeader.nextAll('a[name="Battle-Traits-2"]').first();
                if (btAnchor.length > 0) {
                    const btContainer = btAnchor.nextAll('.Columns2').first();
                    btContainer.find('.BreakInsideAvoid').each((j, el) => {
                        armyObject.battle_traits.push(sanitizeHtml($, $(el)));
                    });
                }

                // 5. Enhancements (Second Columns2 après les Battle Traits ou contenant des h3.h2_pge)
                // On cherche le bloc qui contient les titres de sorts, prières, artefacts
                const enhContainer = aorHeader.nextAll('.Columns2').filter((idx, el) => {
                    return $(el).find('h3.h2_pge').length > 0;
                }).first();

                if (enhContainer.length > 0) {
                    let currentCategory = "";
                    enhContainer.contents().each((j, node) => {
                        const $node = $(node);
                        
                        // Si on tombe sur un h3.h2_pge, on change de catégorie (Spell Lore, etc.)
                        if ($node.is('h3.h2_pge')) {
                            currentCategory = $node.text().trim();
                            armyObject.enhancements.push(`<h3 class="inner-title">${currentCategory}</h3>`);
                        } 
                        // Si c'est un bloc de règle
                        else if ($node.hasClass('BreakInsideAvoid')) {
                            armyObject.enhancements.push(sanitizeHtml($, $node));
                        }
                    });
                }

                results[faction].armies_of_renown.push(armyObject);
            });
        }

        console.log(`✅ ${faction.toUpperCase()} traitée (Standards + Army of Renown).`);
    });
});

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
console.log(`\n🚀 Extraction terminée : ${OUTPUT_FILE}`);