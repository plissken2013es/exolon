import config from "./config.js";
import game from "./engine/game.js";
import global, { resetGlobal } from "./global.js";
import { replaceMap } from "./maps/hotReload.js";

/**
 * The link between the game and the level editor (editor.html).
 *
 * The editor runs the game in an iframe (?embedded) to try the screen being
 * edited: it sends the edited map ("exolon:play-map"), which the game plays
 * from the start of that screen, and pauses the game ("exolon:pause") when
 * going back to editing. Escape in the game asks the editor to go back to
 * editing ("exolon:edit").
 *
 * When not embedded, in development, the E key opens the editor at the
 * current screen.
 */
let phaserGame = null;
let mapsLoaded = false;
const pendingMaps = new Map();

export function initEditorBridge(theGame) {
  phaserGame = theGame;

  if (config.embedded) {
    document.body.classList.add("embedded");
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        sendToEditor({ type: "exolon:edit" });
      }
    });
    sendToEditor({ type: "exolon:ready" });
  } else if (import.meta.env.DEV) {
    window.addEventListener("keydown", (event) => {
      if (event.code === "KeyE" && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const level = (game.currentLevel && game.currentLevel.name) || config.startLevel || global.nextLevel;
        location.href = "editor.html?level=" + level;
      }
    });
  }
}

/**
 * Called once the maps are loaded, before the first screen starts: maps
 * received from the editor in the meantime replace the loaded ones.
 */
export function onMapsLoaded() {
  mapsLoaded = true;
  for (const [name, map] of pendingMaps) {
    replaceMap(phaserGame, name, map);
  }
  pendingMaps.clear();
}

function sendToEditor(message) {
  if (window.parent !== window) {
    window.parent.postMessage(message, location.origin);
  }
}

function onMessage(event) {
  if (event.origin !== location.origin || event.source !== window.parent || !event.data) {
    return;
  }
  const { type, name, map } = event.data;
  if (type === "exolon:play-map") {
    if (!mapsLoaded) {
      // the game starts at this screen anyway (?level in the URL)
      pendingMaps.set(name, map);
      return;
    }
    replaceMap(phaserGame, name, map);
    phaserGame.resume();
    resetGlobal(name);
    game.changeScene("Play");
  } else if (type === "exolon:pause") {
    phaserGame.pause();
  }
}
