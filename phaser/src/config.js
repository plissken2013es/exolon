const config = {
  maxLives: 9,

  initialAmmo: 99,
  initialGrenades: 10,
  initialPoints: 0,
  initialLives: 9,
  initialZones: 0,

  initialLevel: "L01S01",

  // "vitorc" or "exolon"
  initialVitorcOutfit: "vitorc",

  // testing options, set from the URL (see launch.js)
  startLevel: null, // ?level=L02S05: start playing at that screen
  invincible: false, // ?god: the player can't die...
  infiniteAmmo: false, // ...and never runs out of ammo or grenades

  // debug
  renderHitBox: false,
  renderCollisionMap: false,
};

export default config;
