<div align="center">

# 🥐 Pixel Patisserie 🧁

*Every sprite we bake for the game, fresh out of the oven.*

**[See the menu →](https://thecosmickitchen.github.io/pixel-patisserie/)**

</div>

---

## Our Menu

| | Treat | File |
|:-:|---|---|
| <img src="Art/Sprites/oven8.png" width="96" alt="Oven"> | **Oven #8** | [`Art/Sprites/oven8.png`](Art/Sprites/oven8.png) |

## Rotating Specials

| Treat | File |
|---|---|
| **[First Animation #2](https://thecosmickitchen.github.io/pixel-patisserie/#Animations/First%20Animation/First%20Animation%202)** · 106 frames | [`Art/Animations/First Animation/First Animation 2.ase`](<Art/Animations/First Animation/First Animation 2.ase>) |
| **[Puzzle Tile Background](https://thecosmickitchen.github.io/pixel-patisserie/#Animations/Puzzle%20Tile%20Background/Puzzle%20Tile%20Background)** · 6 frames | [`Art/Animations/Puzzle Tile Background/Puzzle Tile Background.ase`](<Art/Animations/Puzzle Tile Background/Puzzle Tile Background.ase>) |

*GitHub can't preview LibreSprite files, so click through to see them on the menu.*

## Adding a new treat

```
Art/
├── Sprites/                      ← everything here goes under "Our Menu"
│   ├── oven8.png                    a sprite with no group
│   └── Kitchen/                     a group: shows as a "Kitchen" heading on the menu
│       ├── mixer.png
│       └── Utensils/                groups can nest: "Kitchen · Utensils"
│           └── spoon.ase
└── Animations/                   ← everything here goes under "Rotating Specials"
    ├── Puzzle Tile Background/      one folder per animation…
    │   └── Puzzle Tile Background.ase   …holding a LibreSprite file
    └── Desserts/                    a group, same as in Sprites/
        └── Whisk/                   …or holding exported frames, played in filename order
            ├── whisk1.png              (numbers sort properly: 2 before 10)
            ├── whisk2.png
            └── …
```

- **Sprites:** put the image or LibreSprite file in `Art/Sprites/`. Put it in a subfolder to group it: each folder becomes a heading on the menu, and nested folders read like "Kitchen · Utensils".
- **Animations:** give each animation its own folder in `Art/Animations/`. The folder holds either one LibreSprite file (`.ase`/`.aseprite`) or numbered PNG frames. Any folders *above* an animation's own folder are its group, the same as for sprites.
- **LibreSprite files** need no export. The menu reads them directly: visible layers are combined as LibreSprite shows them, frames keep the timings set in LibreSprite, and tags become buttons that play just that loop. Exported PNG frames play at 8 frames a second.
- Files anywhere else in `Art/` still show up, using the older rules (a loose image is a sprite, a folder of images is an animation).

Push, and it shows up on the menu by itself. Click any item for its own page with zoom and a download of the current frame as a PNG (plus the original file for LibreSprite art). Animations also get play/pause, frame stepping, a speed slider and a filmstrip. The tables here in the README are updated by hand.

## Opening the shop (GitHub Pages)

Settings → Pages → *Deploy from a branch* → `main` / `(root)`. The menu is `index.html`.
