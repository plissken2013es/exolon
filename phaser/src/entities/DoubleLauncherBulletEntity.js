import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import audio from "../engine/audio.js";
import util from "../util.js";
import BlasterExplosion from "./BlasterExplosion.js";

export default class DoubleLauncherBulletEntity extends Entity {
  constructor(x, y) {
    const settings = {};
    settings.image = "double_launcher_bullet";
    super(x, y + DoubleLauncherBulletEntity.HEIGHT, settings);

    this.gravity = 0;
    this.vel.x = -3;
    this.isLethal = true;
    this.isDestroyable = true;
    this.collidable = true;
  }

  update() {
    this.updateMovement();
    this.handleCollisions();
    return true;
  }

  handleCollisions() {
    const res = game.collide(this);
    const hitVitorc = res && (res.obj.isSolid || res.obj.name == "vitorc");

    if (this.vel.x == 0 || hitVitorc) {
      game.remove(this);
    }

    if (hitVitorc) {
      this.createExplosion();
    }
  }

  onCollision(res, obj) {
    if (obj.name == "blaster_bullet") {
      game.remove(this);
      this.createExplosion();
      util.updatePoints(50);
    }
  }

  createExplosion() {
    const explosion = new BlasterExplosion(this.pos.x, this.pos.y);
    game.add(explosion, this.z);
    game.sort();
    audio.play("burst");
  }
}

DoubleLauncherBulletEntity.WIDTH = 16;
DoubleLauncherBulletEntity.HEIGHT = 16;
