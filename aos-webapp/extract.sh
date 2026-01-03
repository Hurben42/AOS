#!/bin/bash

OUTPUT="./src/data/enhancements_index.json"
FACTIONS_DIR="./public/factions"

echo "{" > $OUTPUT

FILES=$(find "$FACTIONS_DIR" -name "*.html")
FIRST=true

for file in $FILES; do
    name=$(basename "$file" .html)
    if [ "$name" == "Warscrolls" ]; then continue; fi

    if [ "$FIRST" = true ]; then FIRST=false; else echo "  }," >> $OUTPUT; fi
    
    echo "  \"$name\": {" >> $OUTPUT
    
    # Python va scanner les tables ABHEADER qui contiennent les titres Heroic Traits / Artefacts
    enhancements=$(python3 -c "
import re
from html import unescape

def clean(text):
    t = re.sub('<[^<]+?>', '', text) # Supprime HTML
    t = unescape(t).replace(':', '').strip() # Nettoie entités & colons
    return t

try:
    with open('$file', 'r', encoding='utf-8') as f:
        content = f.read()
    
    results = []
    # On cherche les lignes qui contiennent Heroic Traits ou Artefacts dans les headers
    # Puis on prend tous les <b> dans les div qui suivent immédiatement
    pattern = r'class=\"abHeader\".*?>(?:Heroic Traits|Artefacts of Power).*?</table>.*?<div.*?>(.*?)</div>'
    sections = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
    
    for section_html in sections:
        # On extrait les <b> qui sont les noms des aptitudes
        names = re.findall(r'<b>(.*?)</b>', section_html)
        for n in names:
            name = clean(n)
            if len(name) > 3 and name not in ['Effect', 'Declare', 'Passive', 'Target']:
                results.append(name)
    
    print(', '.join(['\"' + n + '\"' for n in list(dict.fromkeys(results))]))
except Exception as e:
    print('')
")
    
    echo "    \"all_enhancements\": [$enhancements]" >> $OUTPUT
done

echo "  }" >> $OUTPUT
echo "}" >> $OUTPUT
echo "✅ Extraction terminée."