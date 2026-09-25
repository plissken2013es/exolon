import Entity from "../engine/Entity.js";
import game from "../engine/game.js";

export default class GrenadeTraceEntity extends Entity {
  constructor(x, y, direction) {
    const settings = {};
    settings.image = "grenade_trace";
    settings.spritewidth = GrenadeTraceEntity.WIDTH;
    super(x, y, settings);

    if (direction == "left") {
      this.flipX(true);
    }

    this.animationspeed = 0.3;
    this.setCurrentAnimation("default", function () {
      game.remove(this);
    });
  }
}

GrenadeTraceEntity.WIDTH = 64;
