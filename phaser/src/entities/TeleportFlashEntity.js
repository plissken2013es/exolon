import Entity from "../engine/Entity.js";
import game from "../engine/game.js";

export default class TeleportFlashEntity extends Entity {
  constructor(x, y) {
    const settings = {};
    settings.image = "teleport_flash";
    settings.spritewidth = TeleportFlashEntity.WIDTH;
    super(x, y + TeleportFlashEntity.HEIGHT, settings);

    this.animationspeed = 0.5;
    this.setCurrentAnimation("default", function () {
      game.remove(this);
    });
  }
}

TeleportFlashEntity.WIDTH = 32;
TeleportFlashEntity.HEIGHT = 48;
