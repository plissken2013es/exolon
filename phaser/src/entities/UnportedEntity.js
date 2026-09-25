import Entity from "../engine/Entity.js";

/**
 * Stand-in for map objects whose entity hasn't been ported yet: draws the
 * object's tile from the map, half transparent, with no behaviour and no
 * collisions.
 */
export default class UnportedEntity extends Entity {
  constructor(x, y, settings) {
    super(x, y, { ...settings, spriteheight: settings.height });
    this.addAnimation("tile", [settings.tileIndex]);
    this.setCurrentAnimation("tile");
    this.sprite.setAlpha(0.5);
  }

  update() {
    return false;
  }
}
