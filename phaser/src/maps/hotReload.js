import * as Phaser from "phaser";
import game from "../engine/game.js";
import global from "../global.js";
import notify from "../ui/notify.js";

/**
 * Replaces a map in the Phaser cache (the next time it's loaded, the game
 * uses the new one).
 */
export function replaceMap(phaserGame, name, data) {
  phaserGame.cache.tilemap.add(name, { format: Phaser.Tilemaps.Formats.TILED_JSON, data });
}

/**
 * Restarts the play screen at the given map if it's the one being played.
 */
export function restartIfPlaying(name) {
  if (game.scene && game.scene.sys.settings.key === "Play" && game.currentLevel && game.currentLevel.name === name) {
    global.nextLevel = name;
    game.changeScene("Play");
    return true;
  }
  return false;
}

/**
 * In development, `npm run dev` converts the TMX maps whenever they change
 * (see vite.config.js) and tells the page, which then reloads them.
 */
export function enableMapHotReload(phaserGame) {
  if (!import.meta.hot) {
    return;
  }

  import.meta.hot.on("exolon:map-updated", async ({ name }) => {
    const response = await fetch(`phaser/maps/${name}.json?t=${Date.now()}`);
    replaceMap(phaserGame, name, await response.json());
    const restarted = restartIfPlaying(name);
    notify(restarted ? `${name} RELOADED` : `${name} UPDATED`);
  });

  import.meta.hot.on("exolon:map-error", ({ name, message }) => {
    console.error(`Map ${name}: ${message}`);
    notify(`ERROR IN ${name}.TMX (SEE THE CONSOLE)`, "#ef0000");
  });
}
