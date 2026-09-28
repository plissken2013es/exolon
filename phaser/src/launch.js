import config from "./config.js";
import { maps } from "./resources.js";

/**
 * Reads the testing options from the URL:
 *
 *   ?level=L02S05  start playing at that screen (after a game over too)
 *   ?god           the player can't die and has infinite ammo and grenades
 *
 * e.g. http://localhost:5173/?level=L02S05&god
 */
export function applyLaunchOptions() {
  const params = new URLSearchParams(location.search);

  const level = (params.get("level") || "").toUpperCase();
  if (level) {
    if (maps.some((map) => map.name === level)) {
      config.startLevel = level;
    } else {
      console.warn(`Unknown screen "${level}" in the URL`);
    }
  }

  if (params.has("god")) {
    config.invincible = true;
    config.infiniteAmmo = true;
  }
}
