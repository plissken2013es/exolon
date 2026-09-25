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

What is ported so far: the loading and title screens, the play screen (all 75
maps, the stars, the HUD, moving between screens, game over) and the player
(movement, jumping, ducking, blaster, grenades, dying and respawning, the
exolon outfit). The other entities of the maps are not ported yet: they are
drawn as half-transparent placeholders without behaviour or collisions (see
`showUnportedEntities` in `phaser/src/config.js`).

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

### Checking the port against the original

`npm run compare` plays the melonJS version and the Phaser port side by side,
one frame at a time and with the same keys held, and reports any difference in
the state of the player. It needs both games served locally: see the comment at
the top of `tools/compare-with-melonjs.mjs`.
