import config from "./config.js";

const global = {
  nextLevel: config.initialLevel,

  // READ ONLY! Use corresponding util functions to set and update.
  ammo: config.initialAmmo,
  grenades: config.initialGrenades,
  points: config.initialPoints,
  lives: config.initialLives,
  zones: config.initialZones,

  aliveBlasterBulletCount: 0,
  aliveGrenadesCount: 0,
  aliveMissilesCount: 0,
};

/**
 * Starts a new game: resets the counters and sets the first screen.
 */
export function resetGlobal(level) {
  Object.assign(global, {
    nextLevel: level,
    ammo: config.initialAmmo,
    grenades: config.initialGrenades,
    points: config.initialPoints,
    lives: config.initialLives,
    zones: config.initialZones,
    aliveBlasterBulletCount: 0,
    aliveGrenadesCount: 0,
    aliveMissilesCount: 0,
  });
}

export default global;
