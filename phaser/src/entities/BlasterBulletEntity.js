import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import audio from "../engine/audio.js";
import global from "../global.js";
import BlasterExplosion from "./BlasterExplosion.js";

export default class BlasterBulletEntity extends Entity {
  constructor(x, y, direction) {
    const settings = {};
    settings.image = "blaster_bullet";
    super(x, y, settings);

    this.name = "blaster_bullet";

    this.direction = direction;
    this.gravity = 0;
    this.passedDistance = 0;

    this.configureVelocity();
  }

  update() {
    this.updateMovement();
    this.updatePassedDistance();
    this.handleCollisions();
    return true;
  }

  configureVelocity() {
    this.vel.x = this.direction == "right" ? BlasterBulletEntity.SPEED : -BlasterBulletEntity.SPEED;
  }

  updatePassedDistance() {
    this.passedDistance += BlasterBulletEntity.SPEED;
    if (this.passedDistance > BlasterBulletEntity.RANGE) {
      game.remove(this);
    }
  }

  handleCollisions() {
    const res = game.collide(this);

    if (this.vel.x == 0 || (res && (res.obj.isSolid || res.obj.isDestroyable))) {
      game.remove(this);
    }

    if (res && res.obj.isSolid) {
      this.createExplosion();
    }
  }

  createExplosion() {
    const explosion = new BlasterExplosion(this.pos.x, this.pos.y - 5);
    game.add(explosion, this.z);
    game.sort();

    audio.play("explosion2");
  }

  onDestroyEvent() {
    global.aliveBlasterBulletCount--;
  }
}

BlasterBulletEntity.SPEED = 6;
BlasterBulletEntity.WIDTH = 16;
BlasterBulletEntity.RANGE = 210;
