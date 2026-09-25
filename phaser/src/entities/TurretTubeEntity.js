import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import audio from "../engine/audio.js";
import util from "../util.js";
import TurretBullet from "./TurretBullet.js";

/**
 * The gun of a turret (or of a combined launcher): fires every now and then.
 * Hitting it is hitting the turret.
 */
export default class TurretTubeEntity extends Entity {
  constructor(x, y, turret) {
    const settings = {};
    settings.image = "turret_tube";
    settings.spritewidth = TurretTubeEntity.WIDTH;
    super(x, y + TurretTubeEntity.HEIGHT, settings);

    this.turret = turret;
    this.collidable = true;
    this.isSolid = true;

    this.addAnimation("default", [0]);
    this.addAnimation("fire", [7, 6, 5, 4, 3, 2, 1, 0]);
    this.setCurrentAnimation("default");
    this.animationspeed = 1;

    this.resetFireDurationAndTimer();
  }

  update() {
    this.updateFireTimer();
    return super.update();
  }

  onCollision(res, obj) {
    this.turret.onCollision(res, obj);
  }

  updateFireTimer() {
    this.fireTimer++;
    if (this.fireTimer > this.fireDuration) {
      this.resetFireDurationAndTimer();
      this.fire();
    }
  }

  fire() {
    this.setCurrentAnimation("fire", "default");
    this.createBullet();
    audio.play("shot1");
  }

  resetFireDurationAndTimer() {
    this.fireDuration = util.getRandomInt(50, 300);
    this.fireTimer = 0;
  }

  createBullet() {
    const bullet = new TurretBullet(this.pos.x - TurretBullet.WIDTH, this.pos.y + 10);
    game.add(bullet, this.z);
    game.sort();
  }
}

TurretTubeEntity.WIDTH = 32;
TurretTubeEntity.HEIGHT = 16;
