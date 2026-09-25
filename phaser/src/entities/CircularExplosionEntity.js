import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import audio from "../engine/audio.js";

export default class CircularExplosionEntity extends Entity {
  constructor(x, y) {
    const settings = {};
    settings.image = "circular_explosion";
    settings.spritewidth = CircularExplosionEntity.WIDTH;
    super(x, y + CircularExplosionEntity.HEIGHT, settings);

    this.animationspeed = 1;
    this.setCurrentAnimation("default", function () {
      game.remove(this);
    });

    audio.play("explosion3");
  }
}

CircularExplosionEntity.WIDTH = 32;
CircularExplosionEntity.HEIGHT = 32;
