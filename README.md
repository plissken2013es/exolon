Exolon - An HTML5 remake of the 1987 ZX Spectrum game
=============================================================================

[Play](http://newagebegins.github.com/exolon/exolon.html)

It works best in Firefox and Chrome.

This game was developed using [melonJS](http://melonjs.org/)

Information about the original game on [worldofspectrum.org](http://www.worldofspectrum.org/infoseekid.cgi?id=0001686)

![Screenshot of the Exolon game](screenshot.gif)

Phaser 4 port (work in progress)
--------------------------------

The game is being ported to [Phaser 4](https://phaser.io/). The original
melonJS version (`exolon.html`, `src/`, `lib/`) stays in place until the port
is complete, so both can be compared.

    npm install
    npm run dev      # http://localhost:5173/
    npm run build    # static build in dist/

Everything from the original is ported: the loading, title, play and bonus
screens, all 75 maps, the player and every entity. The logic reproduces the
melonJS version exactly, including some of its quirks (e.g. stars may be drawn
over the planets, and an object removed twice is destroyed twice), so both
versions play the same.

### How it's organised

- `phaser/src/engine/` is a small layer reproducing the parts of melonJS 0.9.4
  the game logic relies on: the object list and its update order
  (`game.js`), entities with their movement, hit boxes and frame-counted
  animations (`Entity.js`), and collisions with the map (`CollisionMap.js`).
  The logic runs at a fixed 60 updates per second, as the original counted
  time in frames. Rendering, loading, tilemaps, text and sound use Phaser.
- `phaser/src/entities/`, `scenes/` and `hud/` are the game code, ported from
  `src/` with as few changes as possible.
- `phaser/maps/` holds the maps in Tiled JSON, the format Phaser reads. They
  are generated from the TMX maps in `maps/` (still the ones to edit, with
  Tiled) by `npm run maps`.

### Website

`npm run build:site` builds the website published on GitHub Pages (the
`gh-pages` branch) into `dist-site/`: a menu (`site/index.html`) to choose
between the original version (`exolon.html`, at its usual address) and the
Phaser 4 one (`phaser4/`).

The site is published automatically: on every push to the `phaser4` branch,
the "Publish website" workflow (`.github/workflows/publish-site.yml`) builds
it and commits it to the `gh-pages` branch. It can also be run by hand from
the Actions tab.

### Checking the port against the original

`npm run compare` plays the melonJS version and the Phaser port side by side,
one frame at a time, with the same keys held and the same random numbers, and
reports any difference in the state of the player, the counters (ammo, points,
lives...) and the position of every entity. It runs a set of screens from the
three levels by default, or the ones given (`npm run compare -- L02S05`). It
needs both games served locally: see the comment at the top of
`tools/compare-with-melonjs.mjs`.
