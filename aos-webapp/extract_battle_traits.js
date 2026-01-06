const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const INPUT_FILE = path.join(__dirname, 'src/data/factions_full_data.json');
const OUTPUT_FILE = path.join(__dirname, 'src/data/battle_traits_detailed.json');

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
const results = {};

Object.keys(data).forEach(faction => {
    results[faction] = [];

    if (data[faction].battle_traits) {
        data[faction].battle_traits.forEach(html => {
            const $ = cheerio.load(html);
            
            // On cherche le nom de la capacité (souvent en <b> au début)
            let name = $('b').first().text().replace(':', '').trim();

            if (name && name.length > 2) {
                results[faction].push({
                    name: name,
                    html: sanitizeBattleTrait(html)
                });
            }
        });
    }
    console.log(`🚩 ${faction.toUpperCase()} : ${results[faction].length} Battle Traits.`);
});

function sanitizeBattleTrait(html) {
    const $ = cheerio.load(html);
    
    // 1. On retire le fluff (souvent dans .ShowFluff ou .legend4) pour gagner de la place
    $('.ShowFluff, .legend4').remove();
    
    // 2. Nettoyage Wahapedia standard
    $('img, script, style').remove();
    $('*').removeAttr('style').removeAttr('background').removeAttr('width').removeAttr('cellspacing').removeAttr('cellpadding');
    
    // 3. On nettoie les spans de tooltips pour ne garder que le texte
    $('span[data-tooltip-content]').each((i, el) => {
        $(el).replaceWith($(el).text());
    });

    return $('body').html().trim().replace(/\s+/g, ' ');
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));