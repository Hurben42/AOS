export const battleplansData = {
  "Passing Seasons": {
    "Passing Seasons": {
      "scoringType": "per_objective",
      "vpPerObj": 5,
      "scoringDesc": "5 VP par objectif contrôlé",
      "twist": {
        "name": "Burgeoning / Powerful Resurgence",
        "effect": (round) => {
          if (round === 2 || round === 4) return "Burgeoning Rejuvenation : Soin (D3) TOUTES les unités amies sur obj. OU Ward (6+) sur obj.";
          if (round === 3 || round === 5) return "Powerful Resurgence : +1 pour Blesser (Wound) pour les unités amies sur obj.";
          return "Pas de bonus spécifique ce round.";
        }
      }
    },
    "Paths of the Fey": {
      "scoringType": "custom",
      "scoringDesc": "5 / 3 / 2 VP",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 5 },
        { id: 'obj2', label: "Au moins 2 objectifs", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'ennemi", vp: 2 }
      ],
      "twist": {
        "name": "The Spirit Paths Open",
        "effect": (round) => "Underdog obligatoire : Choisissez 2 objectifs. Les unités à 6\" sont retirées et replacées à 6\" de l'autre objectif (plus de 3\" de l'ennemi)."
      }
    },
    "Roiling Roots": {
      "scoringType": "custom",
      "scoringDesc": "5 / 3 / 2 VP",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 5 },
        { id: 'pair', label: "Paire d'objectifs (Même couleur)", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'ennemi", vp: 2 }
      ],
      "twist": {
        "name": "Tangling Tendrils",
        "effect": (round) => "Underdog : Choisissez une paire d'obj (Rouges ou Verts). Les unités ennemies qui les contestent ont Strike-last ce round."
      }
    },
    "Cyclic Shifts": {
      "scoringType": "custom",
      "scoringDesc": "5 / 3 / 2 VP",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 5 },
        { id: 'two', label: "Au moins 2 objectifs", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'ennemi", vp: 2 }
      ],
      "twist": {
        "name": "Unpredictable Evolution",
        "effect": (round) => "Underdog : Choisissez une paire d'objectifs. Ils ne peuvent pas être contrôlés ce round."
      }
    },
    "Surge of Slaughter": {
      "scoringType": "custom",
      "scoringDesc": "5 / 3 / 2 VP (+ Bonus R5)",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 5 },
        { id: 'two', label: "Au moins 2 objectifs", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'ennemi", vp: 2 },
        { id: 'bonusR5', label: "Contrôle Obj. Spécifique (R5 uniquement)", vp: 10 }
      ],
      "twist": {
        "name": "Caustic Sap",
        "effect": (round) => "Underdog : Choisissez un objectif. Jetez un dé pour chaque unité ennemie à 6\" : 1-2 = 1 mortelle, 3+ = D3 mortelles."
      }
    },
    "Linked Ley Lines": {
      "scoringType": "custom",
      "scoringDesc": "3 / 3 / 2 / 2 VP",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 3 },
        { id: 'two', label: "Au moins 2 objectifs", vp: 3 },
        { id: 'pair', label: "Paire connectée (Horiz/Vert)", vp: 2 },
        { id: 'line', label: "Ligne complète (3 obj.)", vp: 2 }
      ],
      "twist": {
        "name": "Rooted in the Realm",
        "effect": (round) => "Underdog (Passif) : +1 Rend contre les Manifestations. Les Manifestations amies ont Strike-first ce round."
      }
    },
    "Noxious Nexus": {
      "scoringType": "custom",
      "scoringDesc": "5 / 3 / 2 VP",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 5 },
        { id: 'pair', label: "Paire d'objectifs contrôlée", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'ennemi", vp: 2 }
      ],
      "twist": {
        "name": "Defense of the Realm",
        "effect": (round) => "Underdog : Choisissez une paire d'obj. Les unités amies qui les contestent ont +1 Rend."
      }
    },
    "The Liferoots": {
      "scoringType": "custom",
      "scoringDesc": "5 / 3 / 2 VP",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 5 },
        { id: 'two', label: "Les deux objectifs", vp: 3 },
        { id: 'moreLiferoot', label: "Plus de points de Liferoot (Décors)", vp: 2 }
      ],
      "twist": {
        "name": "Life Begets Life",
        "effect": (round) => "Underdog : Choisissez une unité amie à 6\" d'un décor. Redonnez-lui 1 figurine (max 3 PV)."
      }
    },
    "Bountiful Equinox": {
      "scoringType": "custom",
      "scoringDesc": "5 / 3 / 2 VP",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 5 },
        { id: 'two', label: "Au moins 2 objectifs", vp: 3 },
        { id: 'equinox', label: "1 Obj 'Aube' + 1 Obj 'Crépuscule'", vp: 2 }
      ],
      "twist": {
        "name": "Rejuvenating Bloom",
        "effect": (round) => "Underdog : Choisissez un objectif. Soignez (3) toutes les unités (amies et ennemies) à 6\"."
      }
    },
    "Lifecycle": {
      "scoringType": "custom",
      "scoringDesc": "Variable (Cycle)",
      "customOptions": [
        { id: 'primary', label: "Objectif Primaire (Cycle)", vp: 2 },
        { id: 'secondary', label: "Chaque Obj. Secondaire", vp: 1 },
        { id: 'all', label: "Contrôle de tous les objectifs", vp: 4 }
      ],
      "twist": {
        "name": "Cycle of Life",
        "effect": (round) => "Round 2 : L'Underdog choisit l'objectif primaire de départ. Le cycle tourne ensuite à chaque round."
      }
    },
    "Creeping Corruption": {
      "scoringType": "custom",
      "scoringDesc": "5 / 3 / 2 VP",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 5 },
        { id: 'two', label: "Au moins 2 objectifs", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'ennemi", vp: 2 }
      ],
      "twist": {
        "name": "Pulsing Life Energies",
        "effect": (round) => "Underdog : Tracez une ligne entre 2 obj. Amis sur la ligne : +1 Cast/Chant. Ennemis sur la ligne : D3 mortelles (sur 3+)."
      }
    },
    "Grasp of Thorns": {
      "scoringType": "custom",
      "scoringDesc": "5 / 3 / 2 VP",
      "customOptions": [
        { id: 'obj1', label: "Au moins 1 objectif", vp: 5 },
        { id: 'two', label: "Au moins 2 objectifs", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'ennemi", vp: 2 }
      ],
      "twist": {
        "name": "Carnivorous Flora",
        "effect": (round) => "Underdog : Choisissez un objectif. Ennemis à 6\" : jet de dé, sur 3+ l'unité est Entangled (Impossible de bouger/TP)."
      }
    }
  }
};