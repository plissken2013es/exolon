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

  // Map objects whose entity has not been ported to Phaser yet are drawn as
  // static placeholders (no behaviour, no collisions) when this is true.
  showUnportedEntities: true,

  // debug
  renderHitBox: false,
  renderCollisionMap: false,
};

export default config;
