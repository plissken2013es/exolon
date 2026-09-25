import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import audio from "../engine/audio.js";
import config from "../config.js";
import util from "../util.js";

export default class AmmoPackEntity extends Entity {
  constructor(x, y, settings) {
    settings.image = "ammo_pack";
    super(x, y, settings);
    this.collidable = true;
    this.updateColRect(2, 28, 2, 30);
  }

  onCollision(res, obj) {
    if (obj.name != "vitorc") {
      return;
    }
    this.collidable = false;
    game.remove(this);
    util.setAmmo(config.initialAmmo);
    audio.play("pick2");
  }
}
