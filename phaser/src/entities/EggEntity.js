import KamikazeEntity from "./KamikazeEntity.js";
import util from "../util.js";
import BlasterExplosion from "./BlasterExplosion.js";

/**
 * An egg wandering around (inside its incubator, when it has one).
 */
export default class EggEntity extends KamikazeEntity {
  constructor(x, y, settings) {
    settings.image = "egg";
    settings.spritewidth = EggEntity.WIDTH;
    super(x, y, settings);

    if (settings.bounds) {
      const { x: left, y: top, w, h } = settings.bounds;
      this.bounds = { left, top, right: left + w, bottom: top + h };
    }

    this.animationspeed = 1;
    this.gravity = 0;
    this.collidable = true;
    this.isDestroyable = true;

    this.vel.x = util.getRandomArbitrary(-4, 2) + 1;
    this.vel.y = util.getRandomArbitrary(-1.5, 0.5) + 0.5;

    this.prevVelX = this.vel.x;
    this.prevVelY = this.vel.y;
  }

  updateMovement() {
    this.normalMove();
    this.shake();
    this.updateVel();
  }

  normalMove() {
    this.prevX = this.pos.x;
    this.prevY = this.pos.y;

    this.pos.add(this.vel);
    this.handleCollisions();
  }

  shake() {
    this.prevX = this.pos.x;
    this.prevY = this.pos.y;
    this.prevVelX = this.vel.x;
    this.prevVelY = this.vel.y;

    this.vel.x = 0;
    this.vel.y = util.getRandomArbitrary(-0.5, 0.5) * util.randomSign();
    this.pos.add(this.vel);
    this.handleCollisions();

    this.vel.x = this.prevVelX;
    this.vel.y = this.prevVelY;
  }

  updateVel() {
    const rnd = util.getRandomInt(0, 6);
    if (rnd == 0) {
      this.vel.x = -this.vel.x;
    } else if (rnd == 1) {
      this.vel.y = -this.vel.y;
    }
  }

  handleCollisions() {
    this.handleCollisionWithBounds();
    this.handleCollisionWithMap();
    this.handleCollisionWithScreenBounds();
  }

  handleCollisionWithBounds() {
    if (!this.bounds) {
      return;
    }

    if (this.right > this.bounds.right || this.left < this.bounds.left) {
      this.pos.x = this.prevX;
      this.vel.x = -this.vel.x;
    }

    if (this.bottom > this.bounds.bottom || this.top < this.bounds.top) {
      this.pos.y = this.prevY;
      this.vel.y = -this.vel.y;
    }
  }

  handleCollisionWithMap() {
    const res = this.collisionMap.checkCollision(this.collisionBox, this.vel);
    this.pos.subtract(res);
    if (res.y) {
      this.vel.y = -this.vel.y;
    }
    if (res.x) {
      this.vel.x = -this.vel.x;
    }
  }

  handleCollisionWithScreenBounds() {
    if (this.pos.x < 0) {
      this.pos.x = 0;
      this.vel.x = -this.vel.x;
    } else if (this.pos.x + this.width > 512) {
      this.pos.x = 512 - this.width;
      this.vel.x = -this.vel.x;
    }

    if (this.pos.y < 0) {
      this.pos.y = 0;
      this.vel.y = -this.vel.y;
    }
  }

  createSpecificExplosion(x, y) {
    return new BlasterExplosion(x, y);
  }
}

EggEntity.prototype.points = 50;

EggEntity.WIDTH = 16;
EggEntity.HEIGHT = 16;
