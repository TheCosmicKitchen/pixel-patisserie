<div align="center">

# 🥐 Pixel Patisserie 🧁

*Every sprite we bake for the game, fresh out of the oven.*

**[See the menu →](https://thecosmickitchen.github.io/pixel-patisserie/)**

</div>

---

## Our Menu

| | Treat | File |
|:-:|---|---|
| <img src="Art/oven8.png" width="96" alt="Oven"> | **Oven #8** | [`Art/oven8.png`](Art/oven8.png) |

## Rotating Specials

| Treat | File |
|---|---|
| **[Puzzle Tile Background](https://thecosmickitchen.github.io/pixel-patisserie/#Puzzle%20Tile%20Backgroundd/Puzzle%20Tile%20Background)** · 6 frames | [`Art/Puzzle Tile Backgroundd/Puzzle Tile Background.ase`](<Art/Puzzle Tile Backgroundd/Puzzle Tile Background.ase>) |

*GitHub can't preview LibreSprite files, so click through to see them on the menu.*

## Adding a new treat

```
Art/
├── oven8.png            ← a still: any image directly in Art/
├── whisk/               ← an animation from exported frames: one subfolder per animation
│   ├── whisk1.png          frames play in filename order,
│   ├── whisk2.png          numbers sorted properly (2 before 10)
│   └── …
└── Puzzle Tile Background/
    └── Puzzle Tile Background.ase   ← a LibreSprite file, straight from the app
```

- **LibreSprite file (`.ase` / `.aseprite`):** save it anywhere in `Art/`, no export needed. The menu reads it directly: one frame shows under *Our Menu*, more than one plays under *Rotating Specials* with the frame timings set in LibreSprite. All visible layers are combined as LibreSprite shows them, and hidden layers stay hidden. Tags you add in LibreSprite become buttons that play just that loop.
- **Still image:** drop the PNG (or GIF, WebP…) straight into `Art/`.
- **Animation from exported frames:** make a folder in `Art/` named after the animation and put its frames in it, numbered in order (`whisk1.png`, `whisk2.png`, … `whisk10.png`). These play at 8 frames a second.

Push, and it shows up on the menu by itself. Click any item for its own page with zoom and a download of the current frame as a PNG (plus the original file for LibreSprite art). Animations also get play/pause, frame stepping, a speed slider and a filmstrip. The tables here in the README are updated by hand.

## Opening the shop (GitHub Pages)

Settings → Pages → *Deploy from a branch* → `main` / `(root)`. The menu is `index.html`.
