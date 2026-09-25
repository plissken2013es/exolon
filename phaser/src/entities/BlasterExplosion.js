import Entity from "../engine/Entity.js";
import game from "../engine/game.js";

export default class BlasterExplosion extends Entity {
  constructor(x, y) {
    const settings = {};
    settings.image = "blaster_explosion";
    settings.spritewidth = 16;

    super(x, y + 16, settings);

    this.addAnimation("default", [0, 1, 2, 3, 2, 1, 2]);
    this.setCurrentAnimation("default", function () {
      game.remove(this);
    });
    this.animationspeed = 1;
  }
}
