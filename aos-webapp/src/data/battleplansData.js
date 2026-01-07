export const battleplansData = {
  "General's Handbook 2024-25": {
    "Passing Seasons": {
      scoringType: "dynamic",
      customOptions: (round) => {
        const type = (round === 1 || round === 3 || round === 5) ? "Gnarlroot" : "Oakenbrow";
        return [
          { id: 'obj_1', label: `Contrôler 1 obj. ${type}`, vp: 5 },
          { id: 'obj_2', label: `Contrôler 2 obj. ${type}`, vp: 5 },
          { id: 'obj_3', label: `Contrôler 3 obj. ${type}`, vp: 5 },
          { id: 'obj_4', label: `Contrôler 4 obj. ${type}`, vp: 5 }
        ];
      }
    },
    "Paths of the Fey": {
      customOptions: [
        { id: 'obj_1', label: "Contrôler au moins 1 objectif", vp: 5 },
        { id: 'obj_2', label: "Contrôler 2 objectifs ou plus", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'adversaire", vp: 2 }
      ]
    },
    "Roiling Roots": {
      customOptions: [
        { id: 'obj_1', label: "Contrôler au moins 1 objectif", vp: 5 },
        { id: 'pairs', label: "Contrôler des paires d'objectifs", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'adversaire", vp: 2 }
      ]
    },
    "Cyclic Shifts": {
      customOptions: [
        { id: 'obj_1', label: "Contrôler au moins 1 objectif", vp: 5 },
        { id: 'obj_2', label: "Contrôler 2 objectifs ou plus", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'adversaire", vp: 2 }
      ]
    },
    "Surge of Slaughter": {
      customOptions: [
        { id: 'obj_1', label: "Contrôler au moins 1 objectif", vp: 5 },
        { id: 'pairs', label: "Contrôler des paires d'objectifs", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'adversaire", vp: 2 }
      ]
    },
    "Linked Ley Lines": {
      customOptions: [
        { id: 'obj_1', label: "Contrôler au moins 1 objectif", vp: 3 },
        { id: 'obj_2', label: "Contrôler 2 objectifs ou plus", vp: 3 },
        { id: 'pairs', label: "Contrôler des paires d'objectifs", vp: 2 },
        { id: 'ley_line', label: "Tous les obj. d'une ligne de Ley", vp: 2 }
      ]
    },
    "Noxious Nexus": {
      noScoringRound: 1,
      customOptions: [
        { id: 'oakenbrow', label: "Contrôler l'obj. Oakenbrow", vp: 5 },
        { id: 'gnarlroot', label: "Contrôler l'obj. Gnarlroot", vp: 3 },
        { id: 'heartwood', label: "Contrôler l'obj. Heartwood", vp: 2 }
      ],
      endOfGameBonus: { id: 'heartwood_final', label: "Contrôle Heartwood (Fin de partie)", vp: 10 }
    },
    "The Liferoots": {
      customOptions: [
        { id: 'obj_1', label: "Contrôler au moins 1 objectif", vp: 5 },
        { id: 'both', label: "Contrôler les 2 objectifs", vp: 3 },
        { id: 'liferoot_more', label: "Plus de liferoot points que l'adv.", vp: 2 }
      ]
    },
    "Bountiful Equinox": {
      customOptions: [
        { id: 'obj_1', label: "Contrôler au moins 1 objectif", vp: 5 },
        { id: 'obj_2', label: "Contrôler 2 objectifs ou plus", vp: 3 },
        { id: 'trio', label: "Contrôler 1 Oaken, 1 Gnarl et 1 Heart", vp: 2 }
      ]
    },
    "Lifecycle": {
      scoringType: "dynamic",
      customOptions: (round) => {
        const options = [
          { id: 'at_least_1', label: "Contrôler au moins 1 objectif", vp: 4 },
          { id: 'more', label: "Plus d'objectifs que l'adversaire", vp: 2 },
          { id: 'primary', label: "Contrôler l'objectif Primaire", vp: 2 },
          { id: 'secondary_1', label: "Contrôler 1 objectif Secondaire", vp: 1 },
          { id: 'secondary_2', label: "Contrôler 2 objectifs Secondaires", vp: 1 }
        ];
        if (round === 1) {
          options.push({ id: 'r1_bonus', label: "Contrôler Oakenbrow + Gnarlroot (R1)", vp: 4 });
        }
        return options;
      }
    },
    "Creeping Corruption": {
      customOptions: [
        { id: 'obj_1', label: "Contrôler au moins 1 objectif", vp: 5 },
        { id: 'obj_2', label: "Contrôler 2 objectifs ou plus", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'adversaire", vp: 2 }
      ]
    },
    "Grasp of Thorns": {
      customOptions: [
        { id: 'obj_1', label: "Contrôler au moins 1 objectif", vp: 5 },
        { id: 'obj_2', label: "Contrôler 2 objectifs ou plus", vp: 3 },
        { id: 'more', label: "Plus d'objectifs que l'adversaire", vp: 2 }
      ]
    }
  }
};