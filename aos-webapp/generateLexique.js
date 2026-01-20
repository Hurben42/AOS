import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATHS = {
  warscrolls: path.join(__dirname, 'src', 'data', 'warscrolls.json'),
  formations: path.join(__dirname, 'src', 'data', 'formations_detailed.json'),
  enhancements: path.join(__dirname, 'src', 'data', 'enhancements_detailed.json'),
  terrains: path.join(__dirname, 'src', 'data', 'factionTerrainIndex.json'),
  spells: path.join(__dirname, 'src', 'data', 'spellsIndex.json'),
  output: path.join(__dirname, 'src', 'data', 'lexique_aoe.json')
};

const generate = () => {
  console.log("🛠️  Génération du Lexique AOE dynamique...");

  const lexicon = {
    factions: [],
    sub_factions: [],
    heroes: [],
    units: [],
    terrains: [],
    spell_lores: [],
    traits: [],
    artefacts: [],
    manifestations: []
  };

  // 1. EXTRACTION DES FACTIONS ET UNITÉS (via Warscrolls)
  if (fs.existsSync(PATHS.warscrolls)) {
    const ws = JSON.parse(fs.readFileSync(PATHS.warscrolls, 'utf8'));
    Object.values(ws).forEach(alliance => {
      Object.entries(alliance).forEach(([factionName, factionUnits]) => {
        lexicon.factions.push(factionName); // Ajout automatique de la faction
        
        if (Array.isArray(factionUnits)) {
          factionUnits.forEach(u => {
            const rawHtml = u.html || "";
            const keywordMatch = rawHtml.match(/<td[^>]*class="[^"]*wsKeywordLine1[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
            
            let isHero = false;
            if (keywordMatch) {
              const keywordsText = keywordMatch[1].replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
              if (keywordsText.includes("HERO")) isHero = true;
            }
            if (isHero) lexicon.heroes.push(u.name);
            else lexicon.units.push(u.name);
          });
        }
      });
    });
  }

  // 2. EXTRACTION DES SUB-FACTIONS (via Formations)
  if (fs.existsSync(PATHS.formations)) {
    const formations = JSON.parse(fs.readFileSync(PATHS.formations, 'utf8'));
    Object.values(formations).forEach(factionData => {
      if (Array.isArray(factionData)) {
        factionData.forEach(form => { if (form.name) lexicon.sub_factions.push(form.name); });
      }
    });
  }

  // 3. TERRAINS
  if (fs.existsSync(PATHS.terrains)) {
    const terr = JSON.parse(fs.readFileSync(PATHS.terrains, 'utf8'));
    Object.values(terr).forEach(tList => {
      if (Array.isArray(tList)) tList.forEach(t => { if (t.name) lexicon.terrains.push(t.name); });
      else if (tList?.name) lexicon.terrains.push(tList.name);
    });
  }

  // 4. ENHANCEMENTS
  if (fs.existsSync(PATHS.enhancements)) {
    const enh = JSON.parse(fs.readFileSync(PATHS.enhancements, 'utf8'));
    Object.values(enh).forEach(f => {
      if (Array.isArray(f.heroic_traits)) f.heroic_traits.forEach(t => lexicon.traits.push(t.name));
      if (Array.isArray(f.artefacts)) f.artefacts.forEach(a => lexicon.artefacts.push(a.name));
    });
  }

  // 5. SPELL LORES
  if (fs.existsSync(PATHS.spells)) {
    const spells = JSON.parse(fs.readFileSync(PATHS.spells, 'utf8'));
    if (spells.factions) {
      Object.values(spells.factions).forEach(lores => {
        Object.keys(lores).forEach(loreName => lexicon.spell_lores.push(loreName));
      });
    }
  }

  const clean = (arr) => [...new Set(arr)].filter(Boolean).sort();
  Object.keys(lexicon).forEach(key => lexicon[key] = clean(lexicon[key]));

  fs.writeFileSync(PATHS.output, JSON.stringify(lexicon, null, 2));
  console.log(`✅ Lexique généré ! Factions: ${lexicon.factions.length}, Sub-Factions: ${lexicon.sub_factions.length}`);
};

generate();