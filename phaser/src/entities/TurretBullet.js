import Entity from "../engine/Entity.js";
import game from "../engine/game.js";

export default class TurretBullet extends Entity {
  constructor(x, y) {
    const settings = {};
    settings.image = "turret_bullet";
    super(x, y, settings);

    this.name = "turret_bullet";

    this.gravity = 0;
    this.vel.x = -5;
    this.isLethal = true;
  }

  update() {
    this.updateMovement();
    this.handleCollisions();
    return true;
  }

  handleCollisions() {
    const res = game.collide(this);

    if (this.vel.x == 0 || (res && (res.obj.isSolid || res.obj.name == "vitorc"))) {
      game.remove(this);
    }
  }
}

TurretBullet.WIDTH = 4;
